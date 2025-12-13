use super::*;

#[derive(Debug, Serialize)]
struct Suggestion {
    name: String,
    description: Option<String>,
    is_command: bool,
    rendered: String,
    span_start: usize, // char index (not byte)
    span_end: usize,   // char index (not byte)
}

impl PartialEq for Suggestion {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name
    }
}
impl Eq for Suggestion {}
impl PartialOrd for Suggestion {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.name.partial_cmp(&other.name)
    }
}
impl Ord for Suggestion {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.name.cmp(&other.name)
    }
}

#[wasm_bindgen]
pub fn completion(input: &str, js_cursor_pos: usize) -> String {
    let engine_guard = ENGINE_STATE
        .get()
        .unwrap()
        .lock()
        .expect("engine state initialized");
    let root = get_pwd();

    // Map UTF-16 cursor position (from JS) to Byte index (for Rust)
    let byte_pos = input
        .char_indices()
        .map(|(i, _)| i)
        .nth(js_cursor_pos)
        .unwrap_or(input.len());

    // 1. Parse & Flatten
    let mut working_set = StateWorkingSet::new(&engine_guard);
    // CRITICAL: Capture the start offset so we can normalize spans later
    let global_offset = working_set.next_span_start();
    let block = parse(&mut working_set, None, input.as_bytes(), false);
    let shapes = flatten_block(&working_set, &block);

    // 2. Identify context
    let mut is_command_pos = false;
    let mut current_span = Span::new(byte_pos, byte_pos);
    let mut prefix = "".to_string();
    let mut found_shape = false;

    // Check if cursor is inside or touching a shape
    for (span, shape) in &shapes {
        // Convert global span to local indices
        let local_start = span.start.saturating_sub(global_offset);
        let local_end = span.end.saturating_sub(global_offset);
        let local_span = Span::new(local_start, local_end);

        if local_span.contains(byte_pos) || local_span.end == byte_pos {
            current_span = local_span;
            found_shape = true;
            let safe_end = std::cmp::min(local_span.end, byte_pos);
            if local_span.start < input.len() {
                prefix = input[local_span.start..safe_end].to_string();
            }

            match shape {
                FlatShape::External(_) | FlatShape::InternalCall(_) | FlatShape::Keyword => {
                    is_command_pos = true;
                }
                FlatShape::Garbage => {
                    // Check if it looks like a flag
                    if prefix.starts_with('-') {
                        is_command_pos = false;
                    } else {
                        // Assume command if it's garbage but not a flag (e.g. typing a new command)
                        is_command_pos = true;
                    }
                }
                _ => {
                    is_command_pos = false;
                }
            }
            break;
        }
    }

    // Fallback to Lexer if in whitespace
    if !found_shape {
        let (tokens, _err) = lex(input.as_bytes(), 0, &[], &[], true);
        let last_token = tokens.iter().filter(|t| t.span.end <= byte_pos).last();

        if let Some(token) = last_token {
            match token.contents {
                TokenContents::Pipe
                | TokenContents::PipePipe
                | TokenContents::Semicolon
                | TokenContents::Eol => {
                    is_command_pos = true;
                }
                _ => {
                    let text = &input[token.span.start..token.span.end];
                    if text == "{" || text == "(" || text == ";" || text == "&&" || text == "||" {
                        is_command_pos = true;
                    } else {
                        is_command_pos = false;
                    }
                }
            }
        } else {
            is_command_pos = true; // Start of input
        }
    }

    let mut suggestions: Vec<Suggestion> = Vec::new();

    // Convert byte-spans back to char-spans for JS
    let to_char_span = |start: usize, end: usize| -> (usize, usize) {
        let char_start = input[..start].chars().count();
        let char_end = input[..end].chars().count();
        (char_start, char_end)
    };

    let (span_start, span_end) = to_char_span(current_span.start, current_span.end);

    let mut add_cmd_suggestion = |name: Vec<u8>, desc: Option<String>| {
        let name = String::from_utf8_lossy(&name).to_string();
        suggestions.push(Suggestion {
            rendered: {
                let name = ansi_term::Color::Green.bold().paint(&name);
                let desc = desc.as_deref().unwrap_or("<no description>");
                format!("{name} {desc}")
            },
            name: name.clone(), // Replacement text is just the name
            description: desc,
            is_command: true,
            span_start,
            span_end,
        });
    };

    let working_set = StateWorkingSet::new(&engine_guard);

    if is_command_pos {
        for (_, name, desc, _) in working_set
            .find_commands_by_predicate(|value| value.starts_with(prefix.as_bytes()), true)
        {
            add_cmd_suggestion(name, desc);
        }
    } else {
        // File completion
        // Split prefix into directory and file part
        let (dir, file_prefix) = if let Some(idx) = prefix.rfind('/') {
            (&prefix[..idx + 1], &prefix[idx + 1..])
        } else {
            ("", prefix.as_str())
        };

        // Fix: Clean up the directory path before joining.
        // VFS often fails if 'join' is called with a trailing slash (e.g. "a/") because it interprets it as "a" + ""
        let dir_to_join = if dir.len() > 1 && dir.ends_with('/') {
            &dir[..dir.len() - 1]
        } else {
            dir
        };

        let target_dir = if !dir.is_empty() {
            match root.join(dir_to_join) {
                Ok(d) => {
                    if let Ok(true) = d.is_dir() {
                        Some(d)
                    } else {
                        None
                    }
                }
                Err(_) => None,
            }
        } else {
            // If prefix is empty, list current directory
            Some(root.join("").unwrap())
        };

        if let Some(d) = target_dir {
            if let Ok(iterator) = d.read_dir() {
                for entry in iterator {
                    let name = entry.filename();
                    if name.starts_with(file_prefix) {
                        let full_completion = format!("{}{}", dir, name);
                        suggestions.push(Suggestion {
                            name: full_completion.clone(),
                            description: None,
                            is_command: false,
                            rendered: full_completion,
                            span_start,
                            span_end,
                        })
                    }
                }
            }
        }
    }

    suggestions.sort();

    serde_json::to_string(&suggestions).unwrap_or_else(|_| "[]".to_string())
}
