use js_sys::Math;
use nu_protocol::Type;
use nu_protocol::engine::Call;
use nu_protocol::{
    Category, IntoPipelineData, PipelineData, ShellError, Signature, Value,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Random;

impl Command for Random {
    fn name(&self) -> &str {
        "random"
    }

    fn signature(&self) -> Signature {
        Signature::build("random")
            .category(Category::Math)
            .input_output_type(Type::Nothing, Type::Float)
    }

    fn description(&self) -> &str {
        "returns a random float between 0 and 1."
    }

    fn run(
        &self,
        _engine_state: &EngineState,
        _stack: &mut Stack,
        call: &Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let v: f64 = Math::random();
        Ok(Value::float(v, call.head).into_pipeline_data())
    }
}
