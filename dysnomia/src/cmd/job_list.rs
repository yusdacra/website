use crate::globals::get_all_tasks;
use nu_protocol::{
    Category, ListStream, PipelineData, Record, ShellError, Signature, Value,
    engine::{Call, Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct JobList;

impl Command for JobList {
    fn name(&self) -> &str {
        "job list"
    }

    fn signature(&self) -> Signature {
        Signature::build("job list").category(Category::System)
    }

    fn description(&self) -> &str {
        "List background jobs."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        _stack: &mut Stack,
        call: &Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let tasks = get_all_tasks();
        let span = call.head;
        let iter = tasks.into_iter().map(move |(id, desc)| {
            let mut rec = Record::new();
            rec.push("id", Value::int(id as i64, span));
            rec.push("description", Value::string(desc, span));
            Value::record(rec, span)
        });
        Ok(PipelineData::list_stream(
            ListStream::new(iter, span, engine_state.signals().clone()),
            None,
        ))
    }
}
