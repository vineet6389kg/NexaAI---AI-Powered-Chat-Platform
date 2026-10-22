import { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { apiFetch } from "./api.js";
import Chat from "./Chat.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function ChatWindow({ onMenu }) {
  const {
    prompt, setPrompt,
    reply, setReply,
    currThreadId,
    setPrevChats, setNewChat,
  } = useContext(MyContext);
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);

  const getReply = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setNewChat(false);
    try {
      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message: prompt, threadId: currThreadId }),
      });
      setReply(res.reply);
    } catch (err) {
      console.log(err);
      setError(err.message || "Could not get a reply. Please try again.");
    }
    setLoading(false);
  };

  // append the new Q&A to the current thread (unchanged logic)
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
    }
    setPrompt("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]);

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
  const canSend = prompt.trim().length > 0 && !loading;

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
                  <p className="truncate text-xs text-muted">{user?.email}</p>
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

      <Chat />

      {/* input area */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          {loading && (
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

          <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-surface px-3 py-2 transition-colors focus-within:border-ring">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything"
              aria-label="Message"
              value={prompt}
              readOnly={loading}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  getReply();
                }
              }}
              className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[0.95rem] outline-none placeholder:text-muted focus-visible:outline-none"
            />
            <button
              onClick={getReply}
              disabled={!canSend}
              aria-label="Send message"
              className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="fa-solid fa-arrow-up" />
            </button>
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