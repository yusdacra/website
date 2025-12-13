use std::{
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::globals::{get_pwd, to_shell_err};
use jacquard::chrono;
use nu_engine::CallExt;
use nu_protocol::{
    Category, ListStream, PipelineData, Record, ShellError, Signature, SyntaxShape, Value,
    engine::{Command, EngineState, Stack},
};

#[derive(Clone)]
pub struct Ls;

impl Command for Ls {
    fn name(&self) -> &str {
        "ls"
    }

    fn signature(&self) -> Signature {
        Signature::build("ls")
            .optional("path", SyntaxShape::String, "the path to list")
            .switch(
                "all",
                "include hidden paths (that start with a dot)",
                Some('a'),
            )
            .switch(
                "long",
                "show detailed information about each file",
                Some('l'),
            )
            .category(Category::FileSystem)
    }

    fn description(&self) -> &str {
        "list the files in the virtual filesystem."
    }

    fn run(
        &self,
        engine_state: &EngineState,
        stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let path_arg: Option<String> = call.opt(engine_state, stack, 0)?;
        let all = call.has_flag(engine_state, stack, "all")?;
        let long = call.has_flag(engine_state, stack, "long")?;

        let mut target_dir = get_pwd();
        if let Some(path) = path_arg {
            target_dir = Arc::new(
                target_dir
                    .join(path.trim_end_matches('/'))
                    .map_err(to_shell_err(call.arguments_span()))?,
            );
        }

        let span = call.head;
        let entries = target_dir.read_dir().map_err(to_shell_err(span))?;

        let make_record = move |name: &str, metadata: &vfs::VfsMetadata| {
            let type_str = match metadata.file_type {
                vfs::VfsFileType::Directory => "dir",
                vfs::VfsFileType::File => "file",
            };

            let mut record = Record::new();
            record.push("name", Value::string(name, span));
            record.push("type", Value::string(type_str, span));
            record.push("size", Value::filesize(metadata.len as i64, span));
            let mut add_timestamp = |field: &str, timestamp: Option<SystemTime>| {
                if let Some(dur) = timestamp.and_then(|s| s.duration_since(UNIX_EPOCH).ok()) {
                    record.push(
                        field,
                        Value::date(
                            chrono::DateTime::from_timestamp_nanos(dur.as_nanos() as i64)
                                .fixed_offset(),
                            span,
                        ),
                    );
                } else {
                    record.push(field, Value::nothing(span));
                }
            };
            add_timestamp("modified", metadata.modified);
            if long {
                add_timestamp("created", metadata.created);
                add_timestamp("accessed", metadata.accessed);
            }
            Value::record(record, span)
        };
        const DIR_METADATA: vfs::VfsMetadata = vfs::VfsMetadata {
            file_type: vfs::VfsFileType::Directory,
            len: 0,
            modified: None,
            created: None,
            accessed: None,
        };

        let dots = if all {
            vec![
                make_record(".", &DIR_METADATA),
                make_record("..", &DIR_METADATA),
            ]
        } else {
            Vec::new()
        };
        let entries = dots
            .into_iter()
            .chain(entries.into_iter().flat_map(move |entry| {
                let do_map = move || {
                    let name = entry.filename();
                    if name.starts_with('.') && !all {
                        return Ok(None);
                    }
                    let metadata = entry.metadata().map_err(to_shell_err(span))?;

                    Ok(Some(make_record(&name, &metadata)))
                };
                do_map()
                    .transpose()
                    .map(|res| res.unwrap_or_else(|err| Value::error(err, span)))
            }));

        let signals = engine_state.signals().clone();
        Ok(PipelineData::list_stream(
            ListStream::new(entries, span, signals.clone()),
            Some(nu_protocol::PipelineMetadata {
                data_source: nu_protocol::DataSource::Ls,
                content_type: None,
                custom: Record::new(),
            }),
        ))
    }
}
