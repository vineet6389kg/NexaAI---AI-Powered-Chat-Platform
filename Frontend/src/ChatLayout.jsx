import { useEffect, useState } from "react";
import { v1 as uuidv1 } from "uuid";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { apiFetch } from "./api.js";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";

export default function ChatLayout() {
  const { user } = useAuth();
  const storageKey = `nexa-thread:${user?.id}`;

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(
    () => localStorage.getItem(storageKey) || uuidv1(),
  );
  const [prevChats, setPrevChats] = useState([]); // all messages of current thread
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  // remember which chat is open
  useEffect(() => {
    localStorage.setItem(storageKey, currThreadId);
  }, [storageKey, currThreadId]);

  // after a refresh, reopen the chat that was open before
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/thread/${currThreadId}`)
      .then((messages) => {
        if (cancelled || !messages.length) return;
        setPrevChats(messages);
        setNewChat(false);
      })
      .catch(() => {}); // not saved yet: stay on the empty new chat
    return () => {
      cancelled = true;
    };
    // run once, when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
  };

  return (
    <MyContext.Provider value={providerValues}>
      <div className="flex h-full overflow-hidden bg-bg text-fg">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ChatWindow onMenu={() => setSidebarOpen(true)} />
      </div>
    </MyContext.Provider>
  );
}