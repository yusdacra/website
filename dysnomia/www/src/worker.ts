import init, {
  init_engine,
  run_command,
  completion,
  highlight,
  get_pwd_string,
  register_console_callback,
  register_task_count_callback,
} from "../../pkg";

// Initialize WASM
await init();
init_engine();

// Setup Callbacks to proxy messages back to Main Thread
register_console_callback((msg: string, isCmd: boolean) => {
  self.postMessage({ type: "console", payload: { msg, isCmd } });
});

register_task_count_callback((count: number) => {
  self.postMessage({ type: "task_count", payload: count });
});

// Handle messages from Main Thread
self.onmessage = (e) => {
  const { id, type, payload } = e.data;

  // console.log("Received message:", id, type, payload);

  try {
    let result;
    switch (type) {
      case "run":
        result = run_command(payload);
        break;
      case "completion":
        result = completion(payload.line, payload.cursor);
        break;
      case "highlight":
        result = highlight(payload);
        break;
      case "get_pwd":
        result = get_pwd_string();
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    self.postMessage({ id, type: `${type}_result`, payload: result });
  } catch (err) {
    self.postMessage({ id, type: "error", payload: String(err) });
  }
};

self.postMessage({ type: "initialized", payload: true });
