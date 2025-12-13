//! An ephemeral in-memory file system, intended mainly for unit tests

use core::cmp;
use std::fmt;
use std::fmt::{Debug, Formatter};
use std::io::{Cursor, Read, Seek, SeekFrom, Write};
use std::mem::swap;
use std::sync::Arc;
use std::time::SystemTime;
use vfs::error::VfsErrorKind;
use vfs::{FileSystem, VfsFileType};
use vfs::{SeekAndRead, VfsMetadata};
use vfs::{SeekAndWrite, VfsResult};

use crate::globals::current_time;

type MemoryFsHandle = Arc<MemoryFsImpl>;

/// An ephemeral in-memory file system, intended mainly for unit tests
pub struct MemoryFS {
    handle: MemoryFsHandle,
}

impl Debug for MemoryFS {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str("In Memory File System")
    }
}

impl MemoryFS {
    /// Create a new in-memory filesystem
    pub fn new() -> Self {
        MemoryFS {
            handle: Arc::new(MemoryFsImpl::new()),
        }
    }

    fn ensure_has_parent(&self, path: &str) -> VfsResult<()> {
        let separator = path.rfind('/');
        if let Some(index) = separator {
            if self.exists(&path[..index])? {
                return Ok(());
            }
        }
        Err(VfsErrorKind::Other("Parent path does not exist".into()).into())
    }
}

impl Default for MemoryFS {
    fn default() -> Self {
        Self::new()
    }
}

struct WritableFile {
    content: Cursor<Vec<u8>>,
    destination: String,
    fs: MemoryFsHandle,
}

impl Seek for WritableFile {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        self.content.seek(pos)
    }
}

impl Write for WritableFile {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.content.write(buf)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.content.flush()?;
        let mut content = self.content.get_ref().clone();
        swap(&mut content, self.content.get_mut());
        let content = Arc::new(content);

        let new_file = self
            .fs
            .files
            .peek_with(&self.destination, |_, previous_file| MemoryFile {
                file_type: VfsFileType::File,
                content: content.clone(),
                created: previous_file.created,
                modified: current_time(),
                accessed: previous_file.accessed,
            })
            .unwrap_or_else(|| {
                let time = current_time();
                MemoryFile {
                    file_type: VfsFileType::File,
                    content,
                    created: time,
                    modified: time,
                    accessed: None,
                }
            });

        // Remove old entry if it exists, then insert new one
        self.fs.files.remove_sync(&self.destination);
        let _ = self
            .fs
            .files
            .insert_sync(self.destination.clone(), new_file);
        Ok(())
    }
}

impl Drop for WritableFile {
    fn drop(&mut self) {
        self.flush()
            .expect("Flush failed while dropping in-memory file");
    }
}

struct ReadableFile {
    #[allow(clippy::rc_buffer)] // to allow accessing the same object as writable
    content: Arc<Vec<u8>>,
    position: u64,
}

impl ReadableFile {
    fn len(&self) -> u64 {
        self.content.len() as u64 - self.position
    }
}

impl Read for ReadableFile {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let amt = cmp::min(buf.len(), self.len() as usize);

        if amt == 1 {
            buf[0] = self.content[self.position as usize];
        } else {
            buf[..amt].copy_from_slice(
                &self.content.as_slice()[self.position as usize..self.position as usize + amt],
            );
        }
        self.position += amt as u64;
        Ok(amt)
    }
}

impl Seek for ReadableFile {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        match pos {
            SeekFrom::Start(offset) => self.position = offset,
            SeekFrom::Current(offset) => self.position = (self.position as i64 + offset) as u64,
            SeekFrom::End(offset) => self.position = (self.content.len() as i64 + offset) as u64,
        }
        Ok(self.position)
    }
}

impl FileSystem for MemoryFS {
    fn read_dir(&self, path: &str) -> VfsResult<Box<dyn Iterator<Item = String> + Send>> {
        let prefix = format!("{}/", path);

        // Ensure the directory exists
        if !self.handle.files.contains(path) {
            return Err(VfsErrorKind::FileNotFound.into());
        }

        let guard = scc::Guard::new();
        let mut entries = Vec::new();

        let range_start = prefix.clone();
        for (candidate_path, _) in self.handle.files.range(range_start.., &guard) {
            if candidate_path.starts_with(&prefix) {
                let rest = &candidate_path[prefix.len()..];
                if !rest.contains('/') {
                    entries.push(rest.to_string());
                }
            } else {
                // we are in a different directory if the prefix doesnt match
                break;
            }
        }

        Ok(Box::new(entries.into_iter()))
    }

    fn create_dir(&self, path: &str) -> VfsResult<()> {
        self.ensure_has_parent(path)?;

        // Check if path already exists and return appropriate error
        if let Some(result) = self
            .handle
            .files
            .peek_with(path, |_, file| match file.file_type {
                VfsFileType::File => Err(VfsErrorKind::FileExists.into()),
                VfsFileType::Directory => Err(VfsErrorKind::DirectoryExists.into()),
            })
        {
            return result;
        }

        let new_dir = MemoryFile {
            file_type: VfsFileType::Directory,
            content: Default::default(),
            created: current_time(),
            modified: current_time(),
            accessed: current_time(),
        };

        self.handle
            .files
            .insert_sync(path.to_string(), new_dir)
            .map_err(|_| VfsErrorKind::DirectoryExists.into())
    }

    fn open_file(&self, path: &str) -> VfsResult<Box<dyn SeekAndRead + Send>> {
        if let Some(time) = current_time() {
            let _ = self.set_access_time(path, time);
        }

        let content = self
            .handle
            .files
            .peek_with(path, |_, file| {
                ensure_file(file)?;
                VfsResult::Ok(file.content.clone())
            })
            .ok_or(VfsErrorKind::FileNotFound)??;

        Ok(Box::new(ReadableFile {
            content,
            position: 0,
        }))
    }

    fn create_file(&self, path: &str) -> VfsResult<Box<dyn SeekAndWrite + Send>> {
        self.ensure_has_parent(path)?;
        let content = Arc::new(Vec::<u8>::new());
        let new_file = MemoryFile {
            file_type: VfsFileType::File,
            content,
            created: current_time(),
            modified: current_time(),
            accessed: current_time(),
        };

        // Remove old entry if it exists, then insert new one
        self.handle.files.remove_sync(path);
        let _ = self.handle.files.insert_sync(path.to_string(), new_file);

        let writer = WritableFile {
            content: Cursor::new(vec![]),
            destination: path.to_string(),
            fs: self.handle.clone(),
        };
        Ok(Box::new(writer))
    }

    fn append_file(&self, path: &str) -> VfsResult<Box<dyn SeekAndWrite + Send>> {
        let content = self
            .handle
            .files
            .peek_with(path, |_, file| file.content.clone())
            .ok_or(VfsErrorKind::FileNotFound)?;
        let mut content = Cursor::new(content.as_slice().to_vec());
        content.seek(SeekFrom::End(0))?;
        let writer = WritableFile {
            content,
            destination: path.to_string(),
            fs: self.handle.clone(),
        };
        Ok(Box::new(writer))
    }

    fn metadata(&self, path: &str) -> VfsResult<VfsMetadata> {
        self.handle
            .files
            .peek_with(path, |_, file| VfsMetadata {
                file_type: file.file_type,
                len: file.content.len() as u64,
                modified: file.modified,
                created: file.created,
                accessed: file.accessed,
            })
            .ok_or(VfsErrorKind::FileNotFound.into())
    }

    fn set_creation_time(&self, path: &str, time: SystemTime) -> VfsResult<()> {
        let updated = self
            .handle
            .files
            .peek_with(path, |_, file| MemoryFile {
                created: Some(time),
                ..file.clone()
            })
            .ok_or(VfsErrorKind::FileNotFound)?;

        self.handle.files.remove_sync(path);
        let _ = self.handle.files.insert_sync(path.to_string(), updated);
        Ok(())
    }

    fn set_modification_time(&self, path: &str, time: SystemTime) -> VfsResult<()> {
        let updated = self
            .handle
            .files
            .peek_with(path, |_, file| MemoryFile {
                modified: Some(time),
                ..file.clone()
            })
            .ok_or(VfsErrorKind::FileNotFound)?;

        self.handle.files.remove_sync(path);
        let _ = self.handle.files.insert_sync(path.to_string(), updated);
        Ok(())
    }

    fn set_access_time(&self, path: &str, time: SystemTime) -> VfsResult<()> {
        let updated = self
            .handle
            .files
            .peek_with(path, |_, file| MemoryFile {
                accessed: Some(time),
                ..file.clone()
            })
            .ok_or(VfsErrorKind::FileNotFound)?;

        self.handle.files.remove_sync(path);
        let _ = self.handle.files.insert_sync(path.to_string(), updated);
        Ok(())
    }

    fn exists(&self, path: &str) -> VfsResult<bool> {
        Ok(self.handle.files.contains(path))
    }

    fn remove_file(&self, path: &str) -> VfsResult<()> {
        self.handle
            .files
            .remove_sync(path)
            .then_some(Ok(()))
            .unwrap_or_else(|| Err(VfsErrorKind::FileNotFound.into()))
    }

    fn remove_dir(&self, path: &str) -> VfsResult<()> {
        if self.read_dir(path)?.next().is_some() {
            return Err(VfsErrorKind::Other("Directory to remove is not empty".into()).into());
        }
        self.handle
            .files
            .remove_sync(path)
            .then_some(Ok(()))
            .unwrap_or_else(|| Err(VfsErrorKind::FileNotFound.into()))
    }
}

struct MemoryFsImpl {
    files: scc::TreeIndex<String, MemoryFile>,
}

impl MemoryFsImpl {
    pub fn new() -> Self {
        let files = scc::TreeIndex::new();
        // Add root directory
        let _ = files.insert_sync(
            "".to_string(),
            MemoryFile {
                file_type: VfsFileType::Directory,
                content: Arc::new(vec![]),
                created: current_time(),
                modified: None,
                accessed: None,
            },
        );
        Self { files }
    }
}

#[derive(Clone)]
struct MemoryFile {
    file_type: VfsFileType,
    content: Arc<Vec<u8>>,

    created: Option<SystemTime>,
    modified: Option<SystemTime>,
    accessed: Option<SystemTime>,
}

fn ensure_file(file: &MemoryFile) -> VfsResult<()> {
    if file.file_type != VfsFileType::File {
        return Err(VfsErrorKind::Other("Not a file".into()).into());
    }
    Ok(())
}
