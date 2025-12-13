use crate::globals::{get_pwd, queue_delta, to_shell_err};
use nu_engine::{CallExt, command_prelude::IoError, eval_block};
use nu_parser::parse;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape,
    debugger::WithoutDebug,
    engine::{Command, EngineState, Stack, StateWorkingSet},
};
use std::{io::Read, path::PathBuf, str::FromStr};

#[derive(Clone)]
pub struct Source;

impl Command for Source {
    fn name(&self) -> &str {
        "source"
    }

    fn signature(&self) -> Signature {
        Signature::build(self.name())
            .required("filename", SyntaxShape::String, "the file to source")
            .category(Category::Core)
    }

    fn description(&self) -> &str {
        "source a file from the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let filename: String = call.req(engine_state, stack, 0)?;

        // 1. Read file from VFS
        let path = get_pwd().join(&filename).map_err(to_shell_err(call.head))?;
        let mut file = path.open_file().map_err(to_shell_err(call.head))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).map_err(|e| {
            ShellError::Io(IoError::new(
                e,
                call.head,
                PathBuf::from_str(path.as_str()).unwrap(),
            ))
        })?;

        // 2. Parse the content
        // We create a new working set based on the CURRENT engine state.
        let mut working_set = StateWorkingSet::new(engine_state);

        // We must add the file to the working set so the parser can track spans correctly
        let _file_id = working_set.add_file(filename.clone(), contents.as_bytes());

        // Parse the block
        let block = parse(
            &mut working_set,
            Some(&filename),
            contents.as_bytes(),
            false,
        );

        if let Some(err) = working_set.parse_errors.first() {
            return Err(ShellError::GenericError {
                error: "Parse error".into(),
                msg: err.to_string(),
                span: Some(call.head),
                help: None,
                inner: vec![],
            });
        }

        // 3. Prepare execution context
        // We clone the engine state to merge the new definitions (delta) locally.
        // This ensures the script can call its own defined functions immediately.
        let mut local_state = engine_state.clone();
        local_state.merge_delta(working_set.delta.clone())?;

        // 4. Queue the delta for the global engine state
        // This allows definitions to be available in the next command execution cycle (REPL behavior).
        queue_delta(working_set.delta);

        // 5. Evaluate the block
        // We pass the MUTABLE stack, so environment variable changes (PWD, load-env) WILL persist.
        eval_block::<WithoutDebug>(&local_state, stack, &block, input).map(|data| data.body)
    }
}
