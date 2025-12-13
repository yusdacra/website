use crate::globals::{get_pwd, get_vfs, set_pwd, to_shell_err};
use nu_engine::CallExt;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape,
    engine::{Command, EngineState, Stack},
};
use std::sync::Arc;
use vfs::VfsFileType;

#[derive(Clone)]
pub struct Cd;

impl Command for Cd {
    fn name(&self) -> &str {
        "cd"
    }

    fn signature(&self) -> Signature {
        Signature::build("cd")
            .optional("path", SyntaxShape::String, "the path to change into")
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "change the current directory in the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        _stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path_arg: Option<String> = call.opt(engine_state, _stack, 0)?;
        let path = path_arg.unwrap_or_else(|| "/".to_string());

        let base: Arc<vfs::VfsPath> = if path.starts_with('/') {
            get_vfs()
        } else {
            get_pwd().clone()
        };

        let target = base
            .join(path.trim_end_matches('/'))
            .map_err(to_shell_err(call.head))?;

        // Ensure target exists and is a directory
        let metadata = target.metadata().map_err(to_shell_err(call.head))?;
        match metadata.file_type {
            VfsFileType::Directory => {
                set_pwd(Arc::new(target));
                Ok(PipelineData::Empty)
            }
            VfsFileType::File => Err(ShellError::GenericError {
                error: "not a directory".to_string(),
                msg: format!("'{}' is not a directory", path),
                span: Some(call.head),
                help: None,
                inner: vec![],
            }),
        }
    }
}
