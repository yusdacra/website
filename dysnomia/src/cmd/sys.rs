use js_sys::Reflect;
use js_sys::global;
use nu_protocol::{
    Category, IntoPipelineData, PipelineData, Record, ShellError, Signature, Value,
    engine::{Command, EngineState, Stack},
};
use wasm_bindgen::JsValue;

#[derive(Clone)]
pub struct Sys;

impl Command for Sys {
    fn name(&self) -> &str {
        "sys"
    }

    fn signature(&self) -> Signature {
        Signature::build("sys").category(Category::System)
    }

    fn description(&self) -> &str {
        "return information about the browser environment (when running in wasm)"
    }

    fn run(
        &self,
        _engine_state: &EngineState,
        _stack: &mut Stack,
        call: &nu_protocol::engine::Call,
        _input: PipelineData,
    ) -> Result<PipelineData, ShellError> {
        let head = call.head;
        let mut rec = Record::new();

        let g = global();

        // navigator-derived fields
        if let Ok(nav) = Reflect::get(&g, &JsValue::from_str("navigator")) {
            if !nav.is_undefined() && !nav.is_null() {
                let ua = Reflect::get(&nav, &JsValue::from_str("userAgent"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("user_agent", Value::string(ua, head));

                let platform = Reflect::get(&nav, &JsValue::from_str("platform"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("platform", Value::string(platform, head));

                let vendor = Reflect::get(&nav, &JsValue::from_str("vendor"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("vendor", Value::string(vendor, head));

                let product = Reflect::get(&nav, &JsValue::from_str("product"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("product", Value::string(product, head));

                let app_name = Reflect::get(&nav, &JsValue::from_str("appName"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("app_name", Value::string(app_name, head));

                let language = Reflect::get(&nav, &JsValue::from_str("language"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                rec.push("language", Value::string(language, head));

                // booleans now use Value::bool
                let online = Reflect::get(&nav, &JsValue::from_str("onLine"))
                    .ok()
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                rec.push("online", Value::bool(online, head));

                let cookie_enabled = Reflect::get(&nav, &JsValue::from_str("cookieEnabled"))
                    .ok()
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                rec.push("cookie_enabled", Value::bool(cookie_enabled, head));

                // numeric-ish fields
                let hardware_concurrency =
                    Reflect::get(&nav, &JsValue::from_str("hardwareConcurrency"))
                        .ok()
                        .and_then(|v| v.as_f64())
                        .map(|f| f as i64);
                if let Some(hc) = hardware_concurrency {
                    rec.push("hardware_concurrency", Value::int(hc, head));
                }

                let device_memory = Reflect::get(&nav, &JsValue::from_str("deviceMemory"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .map(|f| f as i64);
                if let Some(dm) = device_memory {
                    rec.push("device_memory_gb", Value::int(dm, head));
                }

                let max_touch_points = Reflect::get(&nav, &JsValue::from_str("maxTouchPoints"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .map(|f| f as i64);
                if let Some(tp) = max_touch_points {
                    rec.push("max_touch_points", Value::int(tp, head));
                }

                let dnt = Reflect::get(&nav, &JsValue::from_str("doNotTrack"))
                    .ok()
                    .and_then(|v| v.as_string())
                    .unwrap_or_default();
                if !dnt.is_empty() {
                    rec.push("do_not_track", Value::string(dnt, head));
                }
            }
        }

        // screen dimensions (if available)
        if let Ok(screen) = Reflect::get(&g, &JsValue::from_str("screen")) {
            if !screen.is_undefined() && !screen.is_null() {
                let width = Reflect::get(&screen, &JsValue::from_str("width"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .map(|f| f as i64);
                let height = Reflect::get(&screen, &JsValue::from_str("height"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .map(|f| f as i64);
                if let Some(w) = width {
                    rec.push("screen_width", Value::int(w, head));
                }
                if let Some(h) = height {
                    rec.push("screen_height", Value::int(h, head));
                }
            }
        }

        // performance.memory (optional)
        if let Ok(perf) = Reflect::get(&g, &JsValue::from_str("performance")) {
            if !perf.is_undefined() && !perf.is_null() {
                if let Ok(mem) = Reflect::get(&perf, &JsValue::from_str("memory")) {
                    if !mem.is_undefined() && !mem.is_null() {
                        let used = Reflect::get(&mem, &JsValue::from_str("usedJSHeapSize"))
                            .ok()
                            .and_then(|v| v.as_f64())
                            .map(|f| f as i64);
                        let limit = Reflect::get(&mem, &JsValue::from_str("jsHeapSizeLimit"))
                            .ok()
                            .and_then(|v| v.as_f64())
                            .map(|f| f as i64);
                        let mut mrec = Record::new();
                        if let Some(u) = used {
                            mrec.push("used_js_heap_size", Value::filesize(u, head));
                        }
                        if let Some(l) = limit {
                            mrec.push("js_heap_size_limit", Value::filesize(l, head));
                        }
                        if !mrec.is_empty() {
                            rec.push("performance_memory", Value::record(mrec, head));
                        }
                    }
                }
            }
        }

        if rec.is_empty() {
            rec.push(
                "error",
                Value::string("not running in a browser environment", head),
            );
        }

        Ok(Value::record(rec, head).into_pipeline_data())
    }
}
