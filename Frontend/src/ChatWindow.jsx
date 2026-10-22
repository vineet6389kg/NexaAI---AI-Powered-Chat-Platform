import { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { streamChat } from "./api.js";
import { resizeImage } from "./imageUtils.js";
import Chat from "./Chat.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function ChatWindow({ onMenu }) {
  const { prompt, setPrompt, currThreadId, prevChats, setPrevChats, setNewChat } =
    useContext(MyContext);
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gotText, setGotText] = useState(false); // has the first piece arrived?
  const [error, setError] = useState("");
  const [image, setImage] = useState(null); // { mimeType, data }
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  const attach = async (file) => {
    if (!file) return;
    setError("");
    try {
      setImage(await resizeImage(file));
    } catch (err) {
      setError(err.message);
    }
  };

  // send a new message, or (regenerate) answer the last question again
  const send = async ({ regenerate = false } = {}) => {
    if (loading) return;

    const originalPrompt = prompt;
    const img = regenerate ? null : image;
    const message = regenerate
      ? ""
      : prompt.trim() || (img ? "Describe this image." : "");

    if (regenerate ? prevChats.length === 0 : !message) return;

    const snapshot = prevChats; // used to restore if nothing arrives
    const wasNew = prevChats.length === 0;

    setLoading(true);
    setGotText(false);
    setError("");
    setNewChat(false);

    if (regenerate) {
      // empty the last answer; the new one streams into it
      setPrevChats((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: "" };
        return copy;
      });
    } else {
      setPrompt("");
      setImage(null);
      // show the question and an empty answer right away
      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: message, ...(img ? { image: img } : {}) },
        { role: "assistant", content: "" },
      ]);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let received = false;

    // nothing arrived: put everything back the way it was
    const undo = () => {
      if (regenerate) {
        setPrevChats(snapshot);
        return;
      }
      setPrevChats((prev) => prev.slice(0, -2));
      setPrompt(originalPrompt);
      setImage(img);
      if (wasNew) setNewChat(true);
    };

    try {
      await streamChat({
        message,
        threadId: currThreadId,
        image: img,
        regenerate,
        signal: controller.signal,
        onText: (text) => {
          received = true;
          setGotText(true);
          setPrevChats((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + text };
            return copy;
          });
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log(err);
        setError(err.message || "Could not get a reply. Please try again.");
      }
      if (!received) undo(); // with Stop, a partial answer is kept
    }

    abortRef.current = null;
    setLoading(false);
  };

  // grow the textarea with its content (max ~8 lines)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [prompt]);

  // close the profile menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const canSend = prompt.trim().length > 0 || !!image;

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenu}
            aria-label="Open chat history"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-fg md:hidden"
          >
            <i className="fa-solid fa-bars" />
          </button>
          <span className="font-semibold">NexaAI</span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              {initial}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-50 w-60 rounded-xl border border-line bg-bg p-1 shadow-lg">
                <div className="border-b border-line px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted">
                    {user?.isGuest ? "Demo account (deleted after 24 hours)" : user?.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-raised"
                >
                  <i className="fa-solid fa-right-from-bracket w-4 text-muted" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Chat onRegenerate={() => send({ regenerate: true })} busy={loading} />

      {/* input area */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          {loading && !gotText && (
            <div className="mb-2 flex items-center gap-1 px-1 text-muted" role="status" aria-label="NexaAI is thinking">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </div>
          )}
          {error && (
            <p role="alert" className="mb-2 rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="rounded-2xl border border-line-strong bg-surface px-3 py-2 transition-colors focus-within:border-ring">
            {image && (
              <div className="relative mb-2 inline-block">
                <img
                  src={`data:${image.mimeType};base64,${image.data}`}
                  alt="Attached"
                  className="h-16 w-16 rounded-lg border border-line object-cover"
                />
                <button
                  onClick={() => setImage(null)}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fg text-[10px] text-bg"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  attach(e.target.files?.[0]);
                  e.target.value = ""; // allow choosing the same file again
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                aria-label="Attach image"
                title="Attach image"
                className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-raised hover:text-fg disabled:opacity-40"
              >
                <i className="fa-solid fa-paperclip" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask anything"
                aria-label="Message"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onPaste={(e) => {
                  const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
                  if (file) {
                    e.preventDefault();
                    attach(file);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[0.95rem] outline-none placeholder:text-muted focus-visible:outline-none"
              />

              {loading ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop generating"
                  title="Stop generating"
                  className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fg text-bg transition-opacity hover:opacity-80"
                >
                  <i className="fa-solid fa-stop text-xs" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!canSend}
                  aria-label="Send message"
                  className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="fa-solid fa-arrow-up" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            NexaAI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </main>
  );
}

export default ChatWindow;