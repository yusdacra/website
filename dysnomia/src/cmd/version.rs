use nu_protocol::engine::Call;
use nu_protocol::{
    Category, IntoPipelineData, PipelineData, ShellError, Signature, Value,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Version;

impl Command for Version {
    fn name(&self) -> &str {
        "version"
    }

    fn signature(&self) -> Signature {
        Signature::build(self.name()).category(Category::System)
    }

    fn description(&self) -> &str {
        "print the version of dysnomia."
    }

    fn run(
        &self,
        _engine_state: &EngineState,
        _stack: &mut Stack,
        call: &Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        Ok(Value::string("dysnomia.v099.t1765660500", call.head).into_pipeline_data())
    }
}
