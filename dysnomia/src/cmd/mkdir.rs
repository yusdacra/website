use crate::globals::{get_pwd, to_shell_err};
use nu_engine::CallExt;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Mkdir;

impl Command for Mkdir {
    fn name(&self) -> &str {
        "mkdir"
    }

    fn signature(&self) -> Signature {
        Signature::build("mkdir")
            .required(
                "path",
                SyntaxShape::String,
                "path of the directory(s) to create",
            )
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "create a directory in the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path: String = call.req(engine_state, stack, 0)?;
        let new_dir = get_pwd()
            .join(path.trim_end_matches('/'))
            .map_err(to_shell_err(call.head))?;
        new_dir
            .create_dir_all()
            .map_err(to_shell_err(call.head))
            .map(|_| PipelineData::Empty)
    }
}
