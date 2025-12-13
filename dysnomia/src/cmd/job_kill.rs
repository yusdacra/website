use crate::globals::kill_task_by_id;
use nu_engine::CallExt;
use nu_protocol::{
    Category, IntoPipelineData, PipelineData, ShellError, Signature, SyntaxShape, Value,
    engine::{Call, Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct JobKill;

impl Command for JobKill {
    fn name(&self) -> &str {
        "job kill"
    }

    fn signature(&self) -> Signature {
        Signature::build("job kill")
            .required("id", SyntaxShape::Int, "id of job to kill")
            .category(Category::System)
    }

    fn description(&self) -> &str {
        "Kill a background job by ID."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let id: i64 = call.req(engine_state, stack, 0)?;
        if id < 0 {
            return Err(ShellError::GenericError {
                error: "invalid id".to_string(),
                msg: format!("task id must be non-negative, got {}", id),
                span: Some(call.head),
                help: None,
                inner: vec![],
            });
        }

        let killed = kill_task_by_id(id as usize);

        // Return a boolean indicating whether a task was found & killed.
        Ok(Value::bool(killed, call.head).into_pipeline_data())
    }
}
