import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { CanvasAddon } from "@xterm/addon-canvas";
import { WebglAddon } from "@xterm/addon-webgl";

// Import the worker using Vite's explicit worker suffix
// This fixes the "disallowed MIME type" error by ensuring Vite bundles it correctly
import DysnomiaWorker from "./worker?worker";

import "./style.css";
import "@xterm/xterm/css/xterm.css";

type Candidate = {
  name: string;
  description: string;
  is_command: boolean;
  rendered: string;
  span_start: number;
  span_end: number;
};

type SearchState = "history" | "completion" | "none";

async function bootstrap() {
  // Instantiate the worker using the imported class
  const worker = new DysnomiaWorker();

  // Communication Helpers
  let msgId = 0;
  const pending = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >();

  // State to track if WASM is fully loaded
  let isWorkerReady = false;

  const callWorker = (type: string, payload?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  };

  const term = new Terminal({
    cursorBlink: true,
    cursorStyle: "bar",
    cursorInactiveStyle: "block",
    fontFamily: '"Comic Mono", monospace',
    fontSize: 15,
    scrollback: 100000,
    theme: {
      background: "#000000",
      foreground: "#ffffff",
    },
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());

  document.querySelector<HTMLDivElement>("#app")!.innerHTML =
    `<div id="terminal"></div>`;
  term.open(document.getElementById("terminal")!);
  try {
    term.loadAddon(new WebglAddon());
  } catch (err) {
    console.error("WebGL addon failed to load:", err);
    console.warn("falling back to canvas!");
    term.loadAddon(new CanvasAddon());
  }
  fitAddon.fit();

  let activeTasks = 0;
  let currentLine = "";
  let completionBaseLine = "";
  let cursorPos = 0;
  let isRunningCommand = false;

  let searchState: SearchState = "none";
  let completionCandidates: Candidate[] = [];
  let completionIndex = -1;
  const history: string[] = [];
  let historyIndex = 0;

  // Cache PWD to avoid flickering/excessive async calls
  let cachedPwd = "/";

  let readyPromiseResolve: () => void;
  const readyPromise = new Promise<void>((resolve) => {
    readyPromiseResolve = resolve;
  });

  worker.onmessage = (e) => {
    const { id, type, payload } = e.data;

    // console.log("Received message:", id, type, payload);

    if (type === "initialized") {
      isWorkerReady = true;
      readyPromiseResolve();
    }

    if (type === "console") {
      const safeMsg = payload.msg.replace(/\n/g, "\r\n");

      if (!payload.isCmd) {
        // If we are sitting at a prompt, clear it to show the message
        term.write("\r\x1b[2K"); // Clear line
        term.write(safeMsg + "\r\n");
        refreshPrompt();
      } else {
        term.write(safeMsg + "\r\n");
      }
      return;
    }

    if (type === "task_count") {
      activeTasks = payload;
      if (!isRunningCommand) {
        refreshPrompt();
      }
      return;
    }

    if (pending.has(id)) {
      const resolver = pending.get(id)!;
      pending.delete(id);
      if (type === "error") {
        resolver.reject(payload);
      } else {
        resolver.resolve(payload);
      }
    }
  };

  const getPrompt = () => {
    const indicator =
      activeTasks > 0 ? `\x1b[33m(${activeTasks} bg)\x1b[0m ` : "";

    let modeIndicator = "";
    if (searchState === "history") {
      modeIndicator = "\x1b[7m\x1b[34m(h-search)\x1b[0m ";
    } else if (searchState === "completion") {
      modeIndicator = "\x1b[7m\x1b[35m(c-search)\x1b[0m ";
    }

    const pathColor = isWorkerReady ? "\x1b[33m" : "\x1b[30;1m"; // Yellow (ready) vs Dark Gray (loading)
    return `${indicator}${pathColor}${cachedPwd}\x1b[32m/\x1b[0m ${modeIndicator}`;
  };

  // Async Refresh Prompt
  const refreshPrompt = async () => {
    // If we are running a command (blocking), don't redraw prompt
    if (isRunningCommand) return;

    let output = "";
    output += "\r";
    output += "\x1b[2K"; // Clear current line
    output += "\x1b[J"; // Clear everything below

    output += getPrompt();

    try {
      if (currentLine.length > 0 && isWorkerReady) {
        const highlighted = await callWorker("highlight", currentLine);
        output += highlighted;
      } else {
        output += currentLine;
      }
    } catch (e) {
      output += currentLine;
    }

    if (completionCandidates.length > 0) {
      output += "\x1b7"; // Save cursor position
      output += "\r\n";

      const MAX_VISIBLE = 10;
      const total = completionCandidates.length;
      let start = 0;
      let end = total;

      if (total > MAX_VISIBLE) {
        const half = Math.floor(MAX_VISIBLE / 2);
        if (completionIndex < half) {
          start = 0;
          end = MAX_VISIBLE;
        } else if (completionIndex >= total - half) {
          start = total - MAX_VISIBLE;
          end = total;
        } else {
          start = completionIndex - half;
          end = start + MAX_VISIBLE;
        }
      }

      if (start > 0) {
        output += `\x1b[2m... ${start} more\x1b[0m\x1b[K\r\n`;
      }

      for (let i = start; i < end; i++) {
        const cand = completionCandidates[i];
        const isSelected = i === completionIndex;
        let rendered = cand.rendered;

        if (isSelected) {
          rendered = rendered.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
          output += `\x1b[7m${rendered}\x1b[K\x1b[0m\r\n`;
        } else {
          output += `${rendered}\x1b[K\r\n`;
        }
      }

      if (end < total) {
        output += `\x1b[2m... ${total - end} more\x1b[0m\x1b[K\r\n`;
      }

      output += "\x1b8"; // Restore cursor position
    }

    // Move cursor back to correct position
    const distance = currentLine.length - cursorPos;
    if (distance > 0) {
      output += `\x1b[${distance}D`;
    }

    // We write the whole block at once to minimize flicker
    term.write(output);
  };

  const getLineWithCompletion = (baseLine: string, candidate: Candidate) => {
    const before = baseLine.slice(0, candidate.span_start);
    const after = baseLine.slice(candidate.span_end);
    return before + candidate.name + after;
  };

  const applyCompletion = (candidate: Candidate) => {
    currentLine = getLineWithCompletion(currentLine, candidate);
    const before = currentLine.slice(0, candidate.span_start);
    cursorPos = (before + candidate.name).length;
  };

  const updateCompletionCandidates = async () => {
    // Don't try to get completion if worker isn't loaded
    if (!isWorkerReady) return;

    try {
      const json = await callWorker("completion", {
        line: currentLine,
        cursor: cursorPos,
      });
      const candidates: Candidate[] = JSON.parse(json);
      completionCandidates = candidates;
      completionBaseLine = currentLine;

      if (completionCandidates.length > 0) {
        if (completionIndex >= completionCandidates.length) {
          completionIndex = 0;
        }
        if (completionIndex < 0) {
          completionIndex = 0;
        }
      } else {
        completionIndex = -1;
      }
    } catch (err) {
      completionCandidates = [];
      completionIndex = -1;
    }
  };

  const updateHistoryCandidates = () => {
    const query = currentLine.toLowerCase();
    const matches = history.filter((cmd) => {
      let i = 0,
        j = 0;
      const cmdLower = cmd.toLowerCase();
      while (i < query.length && j < cmdLower.length) {
        if (query[i] === cmdLower[j]) i++;
        j++;
      }
      return i === query.length;
    });

    matches.reverse();

    completionCandidates = matches.map((cmd) => ({
      name: cmd,
      description: "",
      is_command: true,
      rendered: cmd,
      span_start: 0,
      span_end: currentLine.length,
    }));

    completionBaseLine = currentLine;

    if (completionCandidates.length > 0) {
      completionIndex = 0;
    } else {
      completionIndex = -1;
    }
  };

  // 1. Setup Input Handler immediately so terminal isn't blocked
  term.onData(async (e) => {
    // SEARCH MODE INPUT
    if (searchState !== "none" && e >= " " && e <= "~") {
      if (cursorPos === currentLine.length) {
        currentLine += e;
        cursorPos++;
      } else {
        currentLine =
          currentLine.slice(0, cursorPos) + e + currentLine.slice(cursorPos);
        cursorPos++;
      }
      term.write(e);

      if (searchState === "history") updateHistoryCandidates();
      if (searchState === "completion") await updateCompletionCandidates();

      await refreshPrompt();
      return;
    }

    // SEARCH MODE BACKSPACE
    if (searchState !== "none" && e === "\u007F") {
      if (cursorPos > 0) {
        currentLine =
          currentLine.slice(0, cursorPos - 1) + currentLine.slice(cursorPos);
        cursorPos--;

        if (searchState === "history") updateHistoryCandidates();
        if (searchState === "completion") await updateCompletionCandidates();

        await refreshPrompt();
      }
      return;
    }

    // EXIT SEARCH MODE (on non-nav keys)
    const isTab = e === "\t" || e === "\x1b[Z";
    const isArrow = e === "\x1b[A" || e === "\x1b[B";

    if (
      !isTab &&
      !isArrow &&
      (completionCandidates.length > 0 || searchState !== "none")
    ) {
      if (e !== "\r") {
        completionCandidates = [];
        completionIndex = -1;
        searchState = "none";
        await refreshPrompt();
      }
    }

    switch (e) {
      case "\r": {
        // ENTER

        // 1. Accept Completion/Search Selection
        if (completionCandidates.length > 0) {
          const cand = completionCandidates[completionIndex];
          if (cand) {
            currentLine = getLineWithCompletion(completionBaseLine, cand);
            cursorPos = currentLine.length;
          }
        }

        const wasInMode =
          searchState != "none" || completionCandidates.length > 0;

        completionCandidates = [];
        searchState = "none";

        if (wasInMode) {
          await refreshPrompt();
          break;
        }

        // 2. Execute Command
        await refreshPrompt(); // Ensure clean line
        term.write("\r\n");
        const trimmed = currentLine.trim();

        if (trimmed.length > 0) {
          currentLine = "";
          isRunningCommand = true;
          try {
            // Check readiness before executing
            if (!isWorkerReady) {
              term.write(
                "\x1b[33mengine is still loading, please wait (_ _ )zZ...\x1b[0m\r\n",
              );
            } else {
              // ASYNC execution
              const output: string | undefined = await callWorker(
                "run",
                trimmed,
              );
              if (output) {
                term.write(output.replace(/\n/g, "\r\n"));
                if (output && !output.endsWith("\n")) {
                  term.write("\r\n");
                }
              }

              // Update cached PWD after command execution (cd, etc)
              cachedPwd = await callWorker("get_pwd");

              // Update History
              const idx = history.indexOf(trimmed);
              if (idx >= 0) history.splice(idx, 1);
              history.push(trimmed);
              historyIndex = history.length;
            }
          } catch (err) {
            term.write(`\x1b[31mfatal: ${err}\x1b[0m\r\n`);
          } finally {
            isRunningCommand = false;
          }
        }

        term.write(getPrompt());
        cursorPos = 0;
        break;
      }

      case "\u007F": // Backspace
        if (cursorPos > 0) {
          currentLine =
            currentLine.slice(0, cursorPos - 1) + currentLine.slice(cursorPos);
          cursorPos--;
          await refreshPrompt();
        }
        break;

      case "\x1b[3~": // Delete
        if (cursorPos < currentLine.length) {
          currentLine =
            currentLine.slice(0, cursorPos) + currentLine.slice(cursorPos + 1);
          await refreshPrompt();
        }
        break;

      case "\u0003": // Ctrl+C
        currentLine = "";
        cursorPos = 0;
        completionCandidates = [];
        searchState = "none";
        term.write("^C\r\n" + getPrompt());
        break;

      case "\u000C": // Ctrl+L
        term.clear();
        break;

      case "\u0012": // Ctrl+R
        searchState = "history";
        updateHistoryCandidates();
        await refreshPrompt();
        break;

      // NAVIGATION

      case "\x1b[D": // Left Arrow
        if (cursorPos > 0) {
          cursorPos--;
          term.write(e); // Local echo is fine for navigation
        }
        break;

      case "\x1b[C": // Right Arrow
        if (cursorPos < currentLine.length) {
          cursorPos++;
          term.write(e);
        }
        break;

      case "\x1b[1;5D": // Ctrl+Left
      case "\x1b\x1b[D": // Alt+Left
        {
          let p = cursorPos;
          while (p > 0 && currentLine[p - 1] === " ") p--;
          while (p > 0 && currentLine[p - 1] !== " ") p--;
          cursorPos = p;
          await refreshPrompt();
        }
        break;

      case "\x1b[1;5C": // Ctrl+Right
      case "\x1b\x1b[C": // Alt+Right
        {
          let p = cursorPos;
          while (p < currentLine.length && currentLine[p] !== " ") p++;
          while (p < currentLine.length && currentLine[p] === " ") p++;
          cursorPos = p;
          await refreshPrompt();
        }
        break;

      case "\x1b[A": // Up Arrow
      case "\x1b[1;5A": // Ctrl+Up
        // Cycle Completion
        if (completionCandidates.length > 0 && e === "\x1b[A") {
          completionIndex =
            (completionIndex - 1 + completionCandidates.length) %
            completionCandidates.length;
          const candidate = completionCandidates[completionIndex];
          currentLine = getLineWithCompletion(completionBaseLine, candidate);
          cursorPos = currentLine.length;
          await refreshPrompt();
          break;
        }

        // History
        if (e === "\x1b[A" || currentLine.length === 0) {
          if (historyIndex > 0) {
            historyIndex--;
            currentLine = history[historyIndex];
            cursorPos = currentLine.length;
            await refreshPrompt();
          }
        } else {
          cursorPos = 0;
          await refreshPrompt();
        }
        break;

      case "\x1b[H": // Home
        cursorPos = 0;
        await refreshPrompt();
        break;

      case "\x1b[B": // Down Arrow
      case "\x1b[1;5B": // Ctrl+Down
        // Cycle Completion
        if (completionCandidates.length > 0 && e === "\x1b[B") {
          completionIndex = (completionIndex + 1) % completionCandidates.length;
          const candidate = completionCandidates[completionIndex];
          currentLine = getLineWithCompletion(completionBaseLine, candidate);
          cursorPos = currentLine.length;
          await refreshPrompt();
          break;
        }

        // History
        if (e === "\x1b[B" || currentLine.length === 0) {
          if (historyIndex < history.length) {
            historyIndex++;
            if (historyIndex === history.length) {
              currentLine = "";
            } else {
              currentLine = history[historyIndex];
            }
            cursorPos = currentLine.length;
            await refreshPrompt();
          }
        } else {
          cursorPos = currentLine.length;
          await refreshPrompt();
        }
        break;

      case "\x1b[F": // End
        cursorPos = currentLine.length;
        await refreshPrompt();
        break;

      case "\t": // Tab
        try {
          if (completionCandidates.length > 0) {
            completionIndex =
              (completionIndex + 1) % completionCandidates.length;

            const candidate = completionCandidates[completionIndex];
            currentLine = getLineWithCompletion(completionBaseLine, candidate);
            await refreshPrompt();
          } else {
            // Guard: ensure worker is ready
            if (!isWorkerReady) return;

            const json = await callWorker("completion", {
              line: currentLine,
              cursor: cursorPos,
            });
            const candidates: Candidate[] = JSON.parse(json);

            if (candidates.length === 1) {
              const candidate = candidates[0];
              applyCompletion(candidate);
              await refreshPrompt();
            } else if (candidates.length > 1) {
              completionCandidates = candidates;
              completionIndex = 0;
              searchState = "completion";
              completionBaseLine = currentLine;
              await refreshPrompt();
            }
          }
        } catch (err) {
          // ignore
        }
        break;

      case "\x1b[Z": // Shift+Tab
        if (completionCandidates.length > 0) {
          completionIndex =
            (completionIndex - 1 + completionCandidates.length) %
            completionCandidates.length;
          const candidate = completionCandidates[completionIndex];
          currentLine = getLineWithCompletion(completionBaseLine, candidate);
          cursorPos = currentLine.length;
          await refreshPrompt();
        }
        break;

      default:
        // Typing
        if (e >= " " && e <= "~") {
          if (cursorPos === currentLine.length) {
            currentLine += e;
            cursorPos++;
          } else {
            currentLine =
              currentLine.slice(0, cursorPos) +
              e +
              currentLine.slice(cursorPos);
            cursorPos++;
          }
          await refreshPrompt();
        }
    }
  });

  window.addEventListener("resize", () => fitAddon.fit());

  await readyPromise;

  await callWorker("run", "open welcome.txt");

  term.write(getPrompt());

  callWorker("get_pwd")
    .then((pwd) => {
      cachedPwd = pwd;
      // Re-render prompt to show "ready" state (yellow path) and enable highlighting
      refreshPrompt();
    })
    .catch((e) => {
      term.write(`\r\n\x1b[31mfatal: failed to load engine: ${e}\x1b[0m\r\n`);
    });
}

bootstrap().catch(console.error);
