import { useContext, useEffect, useState } from "react";
import { v1 as uuidv1 } from "uuid";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { apiFetch } from "./api.js";
import Logo from "./Logo.jsx";
import UpgradeModal from "./UpgradeModal.jsx";

// "Today", "Yesterday", "Previous 7 days"... based on the chat's last update
const groupLabel = (dateStr) => {
  if (!dateStr) return "Older";
  const d = new Date(dateStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startOfToday - day) / 86400000);

  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Previous 7 days";
  if (diff <= 30) return "Previous 30 days";
  return "Older";
};

function Sidebar({ open, onClose }) {
  const {
    allThreads, setAllThreads,
    currThreadId, setCurrThreadId,
    newChat, setNewChat, setPrompt, setReply, setPrevChats,
  } = useContext(MyContext);
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const getAllThreads = async () => {
    try {
      const res = await apiFetch("/thread");
      setAllThreads(
        res.map((t) => ({ threadId: t.threadId, title: t.title, updatedAt: t.updatedAt })),
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    onClose();
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    try {
      const res = await apiFetch(`/thread/${newThreadId}`);
      setPrevChats(res);
      setNewChat(false);
      setReply(null);
      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      await apiFetch(`/thread/${threadId}`, { method: "DELETE" });
      setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      if (threadId === currThreadId) createNewChat();
    } catch (err) {
      console.log(err);
    }
  };

  // group the chats (the server already sends them newest first)
  const groups = [];
  allThreads.forEach((thread) => {
    const label = groupLabel(thread.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(thread);
    else groups.push({ label, items: [thread] });
  });

  const proUntil = user?.proUntil
    ? new Date(user.proUntil).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      {/* dark overlay behind the drawer on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Chat history"
      >
        {/* logo */}
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <Logo size={28} />
          <span className="font-semibold">NexaAI</span>
        </div>

        {/* new chat button */}
        <div className="px-3 pb-2 pt-1">
          <button
            onClick={createNewChat}
            className="flex w-full items-center gap-2.5 rounded-lg border border-line-strong px-3 py-2.5 text-sm font-medium transition-colors hover:bg-raised"
          >
            <i className="fa-regular fa-pen-to-square text-muted" />
            New chat
          </button>
        </div>

        {/* chat history */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
          {allThreads.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <i className="fa-regular fa-comments text-2xl text-muted" />
              <p className="mt-3 text-sm font-medium">No chats yet</p>
              <p className="mt-1 text-xs text-muted">Your conversations will show up here.</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-3">
                <h3 className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </h3>
                <ul className="space-y-0.5">
                  {group.items.map((thread) => {
                    const active = !newChat && thread.threadId === currThreadId;
                    return (
                      <li key={thread.threadId}>
                        <div
                          className={`group relative flex items-center rounded-lg transition-colors ${
                            active ? "bg-raised" : "hover:bg-raised/60"
                          }`}
                        >
                          {/* accent bar on the active chat */}
                          {active && (
                            <span
                              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent"
                              aria-hidden="true"
                            />
                          )}

                          <button
                            onClick={() => changeThread(thread.threadId)}
                            aria-current={active ? "true" : undefined}
                            title={thread.title}
                            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pl-3 pr-1 text-left"
                          >
                            <i
                              className={`fa-regular fa-message w-4 shrink-0 text-center text-xs ${
                                active ? "text-accent dark:text-ring" : "text-muted"
                              }`}
                            />
                            <span
                              className={`truncate text-sm ${active ? "font-medium" : ""}`}
                            >
                              {thread.title}
                            </span>
                          </button>

                          <button
                            onClick={() => deleteThread(thread.threadId)}
                            aria-label={`Delete chat: ${thread.title}`}
                            title="Delete chat"
                            className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-danger focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <i className="fa-regular fa-trash-can text-xs" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>

        {/* upgrade card */}
        <div className="border-t border-line p-3">
          {user?.isPro ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg">
                <i className="fa-solid fa-crown text-sm" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">NexaAI Pro</p>
                <p className="truncate text-xs text-muted">
                  {proUntil ? `Active until ${proUntil}` : "Unlimited messages"}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-line-strong bg-bg p-3 text-left transition-colors hover:bg-raised"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg">
                <i className="fa-solid fa-crown text-sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Upgrade to Pro</span>
                <span className="block truncate text-xs text-muted">
                  Unlimited daily messages
                </span>
              </span>
              <i className="fa-solid fa-chevron-right text-xs text-muted" />
            </button>
          )}
        </div>
      </aside>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

export default Sidebar;