import { useContext, useEffect, useState } from "react";
import { v1 as uuidv1 } from "uuid";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { apiFetch } from "./api.js";
import Logo from "./Logo.jsx";
import UpgradeModal from "./UpgradeModal.jsx";

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
      setAllThreads(res.map((t) => ({ threadId: t.threadId, title: t.title })));
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

        <p className="px-4 pb-1 pt-3 text-xs font-medium text-muted">Recent</p>

        {/* chat history */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {allThreads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No chats yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {allThreads.map((thread) => {
                const active = !newChat && thread.threadId === currThreadId;
                return (
                  <li key={thread.threadId}>
                    <div
                      className={`group flex items-center rounded-lg transition-colors hover:bg-raised ${
                        active ? "bg-raised" : ""
                      }`}
                    >
                      <button
                        onClick={() => changeThread(thread.threadId)}
                        aria-current={active ? "true" : undefined}
                        className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm"
                      >
                        {thread.title}
                      </button>
                      <button
                        onClick={() => deleteThread(thread.threadId)}
                        aria-label={`Delete chat: ${thread.title}`}
                        className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:text-danger focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <i className="fa-regular fa-trash-can text-sm" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
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