use futures::stream::AbortHandle;
use nu_protocol::{
    ShellError, Span,
    engine::{EngineState, StateDelta},
};
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex, OnceLock, RwLock,
        atomic::{AtomicUsize, Ordering},
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use vfs::{VfsError, VfsPath, error::VfsErrorKind};
use wasm_bindgen::prelude::*;

use crate::memory_fs::MemoryFS;

static ROOT: OnceLock<Arc<VfsPath>> = OnceLock::new();

pub fn get_vfs() -> Arc<VfsPath> {
    ROOT.get_or_init(|| Arc::new(VfsPath::new(MemoryFS::new())))
        .clone()
}

static PWD: OnceLock<RwLock<Arc<VfsPath>>> = OnceLock::new();

pub fn get_pwd() -> Arc<VfsPath> {
    PWD.get_or_init(|| RwLock::new(get_vfs()))
        .read()
        .unwrap()
        .clone()
}

pub fn set_pwd(path: Arc<VfsPath>) {
    *PWD.get_or_init(|| RwLock::new(get_vfs())).write().unwrap() = path;
}

pub fn to_shell_err(span: Span) -> impl Fn(VfsError) -> ShellError {
    move |vfs_error: VfsError| ShellError::GenericError {
        error: (match vfs_error.kind() {
            VfsErrorKind::DirectoryExists
            | VfsErrorKind::FileExists
            | VfsErrorKind::FileNotFound
            | VfsErrorKind::InvalidPath => "path error",
            _ => "io error",
        })
        .to_string(),
        msg: vfs_error.to_string(),
        span: Some(span),
        help: None,
        inner: vec![],
    }
}

pub struct TaskInfo {
    pub id: usize,
    pub description: String,
    pub handle: AbortHandle,
}

pub struct CallbackWrapper(js_sys::Function);
unsafe impl Send for CallbackWrapper {}
unsafe impl Sync for CallbackWrapper {}

static NEXT_TASK_ID: AtomicUsize = AtomicUsize::new(1);
static TASK_REGISTRY: OnceLock<Mutex<HashMap<usize, TaskInfo>>> = OnceLock::new();
static TASK_CALLBACK: OnceLock<Mutex<Option<CallbackWrapper>>> = OnceLock::new();

pub fn get_registry() -> &'static Mutex<HashMap<usize, TaskInfo>> {
    TASK_REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

#[wasm_bindgen]
pub fn register_task_count_callback(f: js_sys::Function) {
    let _ = TASK_CALLBACK.get_or_init(|| Mutex::new(None));
    if let Ok(mut guard) = TASK_CALLBACK.get().unwrap().lock() {
        *guard = Some(CallbackWrapper(f));
    }
}

pub fn notify_task_count() {
    if let Some(mutex) = TASK_CALLBACK.get() {
        if let Ok(guard) = mutex.lock() {
            if let Some(cb) = guard.as_ref() {
                let count = if let Ok(reg) = get_registry().lock() {
                    reg.len()
                } else {
                    0
                };
                let this = JsValue::NULL;
                let arg = JsValue::from(count as u32);
                let _ = cb.0.call1(&this, &arg);
            }
        }
    }
}

pub fn register_task(description: String, handle: AbortHandle) -> usize {
    let id = NEXT_TASK_ID.fetch_add(1, Ordering::Relaxed);
    if let Ok(mut reg) = get_registry().lock() {
        reg.insert(
            id,
            TaskInfo {
                id,
                description,
                handle,
            },
        );
    }
    notify_task_count();
    id
}

pub fn remove_task(id: usize) {
    if let Ok(mut reg) = get_registry().lock() {
        reg.remove(&id);
    }
    notify_task_count();
}

pub fn get_all_tasks() -> Vec<(usize, String)> {
    if let Ok(reg) = get_registry().lock() {
        reg.values()
            .map(|t| (t.id, t.description.clone()))
            .collect()
    } else {
        vec![]
    }
}

pub fn kill_task_by_id(id: usize) -> bool {
    if let Ok(mut reg) = get_registry().lock() {
        if let Some(task) = reg.remove(&id) {
            task.handle.abort();
            drop(reg);
            notify_task_count();
            return true;
        }
    }
    false
}

static PENDING_DELTAS: OnceLock<Mutex<Vec<StateDelta>>> = OnceLock::new();

pub fn queue_delta(delta: StateDelta) {
    let _ = PENDING_DELTAS.get_or_init(|| Mutex::new(Vec::new()));
    if let Ok(mut guard) = PENDING_DELTAS.get().unwrap().lock() {
        guard.push(delta);
    }
}

pub fn apply_pending_deltas(engine_state: &mut EngineState) -> Result<(), ShellError> {
    if let Some(mutex) = PENDING_DELTAS.get() {
        if let Ok(mut guard) = mutex.lock() {
            for delta in guard.drain(..) {
                engine_state.merge_delta(delta)?;
            }
        }
    }
    Ok(())
}

pub static CONSOLE_CALLBACK: OnceLock<Mutex<Option<CallbackWrapper>>> = OnceLock::new();

#[wasm_bindgen]
pub fn register_console_callback(f: js_sys::Function) {
    let _ = CONSOLE_CALLBACK.get_or_init(|| Mutex::new(None));
    if let Ok(mut guard) = CONSOLE_CALLBACK.get().unwrap().lock() {
        *guard = Some(CallbackWrapper(f));
    }
}

pub fn print_to_console(msg: &str, is_cmd: bool) {
    if let Some(mutex) = CONSOLE_CALLBACK.get() {
        if let Ok(guard) = mutex.lock() {
            if let Some(cb) = guard.as_ref() {
                let this = JsValue::NULL;
                let arg = JsValue::from_str(msg);
                let arg2 = JsValue::from_bool(is_cmd);
                let _ = cb.0.call2(&this, &arg, &arg2);
            }
        }
    }
}

pub fn current_time() -> Option<SystemTime> {
    UNIX_EPOCH.checked_add(Duration::from_millis(js_sys::Date::now() as u64))
}
