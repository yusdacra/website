use crate::globals::{get_pwd, to_shell_err};
use nu_engine::CallExt;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape, Type, Value,
    engine::{Command, EngineState, Stack},
};
use vfs::VfsError;

#[derive(Clone)]
pub struct Save;

impl Command for Save {
    fn name(&self) -> &str {
        "save"
    }

    fn signature(&self) -> Signature {
        Signature::build("save")
            .required("path", SyntaxShape::String, "path to write the data to")
            .input_output_types(vec![(Type::Any, Type::Nothing)])
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "save content to a file in the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path: String = call.req(engine_state, stack, 0)?;

        let value = input.into_value(call.head)?;
        let contents = match value {
            Value::String { val, .. } => val.into_bytes(),
            Value::Binary { val, .. } => val,
            Value::Bool { val, .. } => val.to_string().into_bytes(),
            Value::Float { val, .. } => val.to_string().into_bytes(),
            Value::Int { val, .. } => val.to_string().into_bytes(),
            Value::Date { val, .. } => val.to_string().into_bytes(),
            _ => {
                return Err(ShellError::CantConvert {
                    to_type: "string".to_string(),
                    from_type: value.get_type().to_string(),
                    span: value.span(),
                    help: None,
                });
            }
        };

        let target_file = get_pwd().join(&path).map_err(to_shell_err(call.head))?;

        target_file
            .create_file()
            .map_err(to_shell_err(call.head))
            .and_then(|mut f| {
                f.write_all(&contents)
                    .map_err(VfsError::from)
                    .map_err(to_shell_err(call.head))
            })
            .map(|_| PipelineData::Empty)
    }
}
