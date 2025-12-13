use std::ops::Not;

use crate::globals::{get_pwd, to_shell_err};
use nu_command::{FromCsv, FromJson, FromOds, FromToml, FromTsv, FromXlsx, FromXml, FromYaml};
use nu_engine::CallExt;
use nu_protocol::{
    ByteStream, Category, PipelineData, ShellError, Signature, SyntaxShape,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Open;

impl Command for Open {
    fn name(&self) -> &str {
        "open"
    }

    fn signature(&self) -> Signature {
        Signature::build("open")
            .required("path", SyntaxShape::String, "path to the file")
            .switch(
                "raw",
                "output content as raw string/binary without parsing",
                Some('r'),
            )
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "open a file from the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path: String = call.req(engine_state, stack, 0)?;
        let raw_flag = call.has_flag(engine_state, stack, "raw")?;

        let target_file = get_pwd().join(&path).map_err(to_shell_err(call.head))?;

        let parse_cmd = raw_flag
            .not()
            .then(|| {
                target_file
                    .extension()
                    .and_then(|ext| get_cmd_for_ext(&ext))
            })
            .flatten();

        target_file
            .open_file()
            .map_err(to_shell_err(call.head))
            .and_then(|f| {
                let data = PipelineData::ByteStream(
                    ByteStream::read(
                        f,
                        call.head,
                        engine_state.signals().clone(),
                        nu_protocol::ByteStreamType::String,
                    ),
                    None,
                );
                if let Some(cmd) = parse_cmd {
                    return cmd.run(engine_state, stack, call, data);
                }
                Ok(data)
            })
    }
}

fn get_cmd_for_ext(ext: &str) -> Option<Box<dyn Command>> {
    Some(match ext {
        "json" => Box::new(FromJson),
        "yaml" | "yml" => Box::new(FromYaml),
        "toml" => Box::new(FromToml),
        "csv" => Box::new(FromCsv),
        "ods" => Box::new(FromOds),
        "tsv" => Box::new(FromTsv),
        "xml" => Box::new(FromXml),
        "xlsx" => Box::new(FromXlsx),
        _ => return None,
    })
}
