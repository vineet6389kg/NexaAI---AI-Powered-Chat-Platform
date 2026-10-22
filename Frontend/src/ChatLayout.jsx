import { useState } from "react";
import { v1 as uuidv1 } from "uuid";
import { MyContext } from "./MyContext.jsx";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";

export default function ChatLayout() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); // all messages of current thread
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

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