use jacquard::chrono;
use miette::Report;
use nu_cmd_extra::add_extra_command_context;
use nu_cmd_lang::create_default_context;
use nu_engine::{command_prelude::*, eval_block};
use nu_parser::{FlatShape, TokenContents, flatten_block, lex, parse};
use nu_protocol::{
    Config, PipelineData, Span,
    engine::{Call, EngineState, Stack, StateWorkingSet},
};
use serde::Serialize;
use std::{
    sync::{Arc, Mutex, OnceLock},
    time::UNIX_EPOCH,
};
use vfs::VfsError;
use wasm_bindgen::prelude::*;

pub mod cmd;
pub mod completion;
pub mod default_context;
pub mod error;
pub mod globals;
pub mod highlight;
pub mod memory_fs;

use crate::{
    cmd::{
        Cd, Fetch, Job, JobKill, JobList, Ls, Mkdir, Open, Pwd, Random, Rm, Save, Source, Sys,
        Version,
    },
    default_context::add_shell_command_context,
    error::format_error,
    globals::{apply_pending_deltas, current_time, get_pwd, print_to_console},
};
use error::CommandError;
use globals::get_vfs;

static ENGINE_STATE: OnceLock<Mutex<EngineState>> = OnceLock::new();
static STACK: OnceLock<Mutex<Stack>> = OnceLock::new();

fn init_engine_internal() -> Result<(), Report> {
    let mut engine_state = create_default_context();
    engine_state = add_shell_command_context(engine_state);
    engine_state = add_extra_command_context(engine_state);

    let write_file = |name: &str, contents: &str| {
        get_vfs()
            .join(name)
            .and_then(|p| p.create_file())
            .and_then(|mut f| f.write_all(contents.as_bytes()).map_err(VfsError::from))
            .map_err(|e| miette::miette!(e.to_string()))
    };

    let access_log = format!(
        r#"/dysnomia.v000 /user: 90008/ /ip: [REDACTED]/ /time: [REDACTED]//
/dysnomia.v002 /user: 90008/ /ip: [REDACTED]/ /time: [REDACTED]//
/dysnomia.v011 /user: 90008/ /ip: [REDACTED]/ /time: [REDACTED]//
[...ENTRIES TRUNCATED...]
/dysnomia.v099 /user: anonymous/ /ip: [REDACTED]/ /time: {time}//"#,
        time = current_time()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map_or_else(
                || "unknown".to_string(),
                |time| chrono::DateTime::from_timestamp_nanos(time.as_nanos() as i64)
                    .format("%Y-%m-%dT%H:%M:%SZ")
                    .to_string()
            )
    );
    write_file(".access.log", &access_log)?;

    let welcome_txt = r#"welcome  anonymous !


you are interfacing with dysnomia.v099
using the nu shell.


a few commands you can try:

"hello, user!" | save message.txt
fetch at://ptr.pet
ls --help"#;
    write_file("welcome.txt", &welcome_txt)?;

    let mut working_set = StateWorkingSet::new(&engine_state);
    let decls: [Box<dyn Command>; 15] = [
        Box::new(Ls),
        Box::new(Open),
        Box::new(Save),
        Box::new(Mkdir),
        Box::new(Pwd),
        Box::new(Cd),
        Box::new(Rm),
        Box::new(Fetch),
        Box::new(Source),
        Box::new(Job),
        Box::new(JobList),
        Box::new(JobKill),
        Box::new(Sys),
        Box::new(Random),
        Box::new(Version),
    ];
    for decl in decls {
        working_set.add_decl(decl);
    }
    engine_state.merge_delta(working_set.delta)?;

    let mut config = Config::default();
    config.use_ansi_coloring = true.into();
    config.show_banner = nu_protocol::BannerKind::Full;
    engine_state.config = Arc::new(config);

    ENGINE_STATE
        .set(Mutex::new(engine_state))
        .map_err(|_| miette::miette!("ENGINE_STATE was already set!?"))?;
    STACK
        .set(Mutex::new(Stack::new()))
        .map_err(|_| miette::miette!("STACK was already set!?"))?;

    // web_sys::console::log_1(&"Hello, World!".into());

    Ok(())
}

#[wasm_bindgen]
pub fn init_engine() -> String {
    console_error_panic_hook::set_once();
    init_engine_internal().map_or_else(|err| format!("error: {err}"), |_| String::new())
}

fn run_command_internal(
    engine_state: &mut EngineState,
    stack: &mut Stack,
    input: &str,
) -> Result<(), CommandError> {
    // apply any pending deltas from previous commands (like `source`)
    apply_pending_deltas(engine_state).map_err(|e| CommandError {
        error: Report::new(e),
        start_offset: 0,
    })?;
    // set PWD
    engine_state.add_env_var(
        "PWD".to_string(),
        get_pwd_string().into_value(Span::unknown()),
    );

    let mut working_set = StateWorkingSet::new(engine_state);

    // Capture the start offset *before* adding the file, as this is the global offset
    // where our file begins.
    let start_offset = working_set.next_span_start();
    let block = parse(&mut working_set, Some("entry"), input.as_bytes(), false);

    let cmd_err = |err: ShellError| CommandError {
        error: Report::new(err),
        start_offset,
    };

    if let Some(err) = working_set.parse_errors.into_iter().next() {
        return Err(CommandError {
            error: Report::new(err),
            start_offset,
        });
    }
    if let Some(err) = working_set.compile_errors.into_iter().next() {
        return Err(CommandError {
            error: Report::new(err),
            start_offset,
        });
    }

    engine_state
        .merge_delta(working_set.delta)
        .map_err(cmd_err)?;
    let result = eval_block::<nu_protocol::debugger::WithoutDebug>(
        engine_state,
        stack,
        &block,
        PipelineData::Empty,
    );

    let pipeline_data = result.map_err(cmd_err)?;
    let table_command = nu_command::Table;
    let call = Call::new(pipeline_data.span().unwrap_or_else(Span::unknown));

    let res = table_command
        .run(engine_state, stack, &call, pipeline_data.body)
        .map_err(cmd_err)?;

    match res {
        PipelineData::Empty => {}
        PipelineData::Value(v, _) => {
            print_to_console(&v.to_expanded_string("\n", &engine_state.config), true)
        }
        PipelineData::ByteStream(s, _) => {
            for line in s.lines().into_iter().flatten() {
                let out = line.map_err(|e| CommandError {
                    error: Report::new(e),
                    start_offset,
                })?;
                print_to_console(&out, true);
            }
        }
        PipelineData::ListStream(s, _) => {
            for item in s.into_iter() {
                let out = item.to_expanded_string("\n", &engine_state.config);
                print_to_console(&out, true);
            }
        }
    }

    Ok(())
}

#[wasm_bindgen]
pub fn run_command(input: &str) -> Option<String> {
    let (mut engine_guard, mut stack_guard) = (
        ENGINE_STATE
            .get()
            .unwrap()
            .lock()
            .expect("engine state initialized"),
        STACK.get().unwrap().lock().expect("stack initialized"),
    );

    let result = std::panic::catch_unwind(move || {
        match run_command_internal(&mut engine_guard, &mut stack_guard, input) {
            Ok(_) => None,
            Err(cmd_err) => Some(format_error(
                cmd_err.error,
                input.to_owned(),
                cmd_err.start_offset,
            )),
        }
    });
    result.unwrap_or_else(|err| Some(format!("panicked: {err:?}")))
}

#[wasm_bindgen]
pub fn get_pwd_string() -> String {
    // web_sys::console::log_1(&"before pwd".into());
    let pwd = get_pwd();
    // web_sys::console::log_1(&"after pwd".into());
    if pwd.is_root() {
        return "/".to_string();
    }
    pwd.as_str().to_string()
}
