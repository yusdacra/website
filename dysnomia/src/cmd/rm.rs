use crate::globals::{get_pwd, to_shell_err};
use nu_engine::CallExt;
use nu_protocol::{
    Category, PipelineData, ShellError, Signature, SyntaxShape,
    engine::{Command, EngineState, Stack},
};
use vfs::VfsFileType;

#[derive(Clone)]
pub struct Rm;

impl Command for Rm {
    fn name(&self) -> &str {
        "rm"
    }

    fn signature(&self) -> Signature {
        Signature::build("rm")
            .required(
                "path",
                SyntaxShape::String,
                "path to file or directory to remove",
            )
            .switch(
                "recursive",
                "remove directories and their contents recursively",
                Some('r'),
            )
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "remove a file or directory from the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path: String = call.req(engine_state, stack, 0)?;
        let recursive = call.has_flag(engine_state, stack, "recursive")?;

        // Prevent removing root
        if path == "/" {
            return Err(ShellError::GenericError {
                error: "cannot remove root".to_string(),
                msg: "refusing to remove root directory".to_string(),
                span: Some(call.head),
                help: None,
                inner: vec![],
            });
        }

        // Resolve target relative to PWD (or absolute if path starts with '/')
        let target = get_pwd()
            .join(path.trim_end_matches('/'))
            .map_err(to_shell_err(call.head))?;

        let meta = target.metadata().map_err(to_shell_err(call.head))?;
        match meta.file_type {
            VfsFileType::File => {
                target.remove_file().map_err(to_shell_err(call.head))?;
                Ok(PipelineData::Empty)
            }
            VfsFileType::Directory => {
                (if recursive {
                    target.remove_dir_all()
                } else {
                    // non-recursive: attempt to remove directory (will fail if not empty)
                    target.remove_dir()
                })
                .map_err(to_shell_err(call.head))
                .map(|_| PipelineData::Empty)
            }
        }
    }
}
