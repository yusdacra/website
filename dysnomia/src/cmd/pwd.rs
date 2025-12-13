use crate::globals::get_pwd;
use nu_protocol::engine::Call;
use nu_protocol::{
    Category, IntoPipelineData, PipelineData, ShellError, Signature, Value,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Pwd;

impl Command for Pwd {
    fn name(&self) -> &str {
        "pwd"
    }

    fn signature(&self) -> Signature {
        Signature::build("pwd").category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "print the current working directory in the virtual filesystem."
    }

    fn run(
        &self,
        _engine_state: &EngineState,
        _stack: &mut Stack,
        call: &Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let mut pwd = get_pwd().as_str().to_string();
        if pwd.is_empty() {
            pwd.push('/');
        }
        Ok(Value::string(pwd, call.head).into_pipeline_data())
    }
}
