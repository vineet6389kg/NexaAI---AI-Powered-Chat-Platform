import { useContext, useEffect } from "react";
import { v1 as uuidv1 } from "uuid";
import { MyContext } from "./MyContext.jsx";
import { apiFetch } from "./api.js";
import Logo from "./Logo.jsx";

function Sidebar({ open, onClose }) {
  const {
    allThreads, setAllThreads,
    currThreadId, setCurrThreadId,
    setNewChat, setPrompt, setReply, setPrevChats,
  } = useContext(MyContext);

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
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 px-1">
            <Logo size={28} />
            <span className="font-semibold">NexaAI</span>
          </div>
          <button
            onClick={createNewChat}
            aria-label="New chat"
            title="New chat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <i className="fa-regular fa-pen-to-square" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {allThreads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No chats yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {allThreads.map((thread) => {
                const active = thread.threadId === currThreadId;
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

        <div className="border-t border-line p-4 text-center text-sm text-muted">
          By Me <span className="text-danger">&hearts;</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;