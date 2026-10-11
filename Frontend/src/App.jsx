import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow";
import { MyContext } from "./MyContext.jsx";
import { use, useState } from "react";
import {v1 as uuidv1} from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply]  = useState(null);
  const [currThreadId, setCurrThreadId]= useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); // store all chats off curr thread
  const [newChats, setNewChats] = useState(true);


  const providervalues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId


  }; 
  return (
    <div className="app">
      <MyContext.Provider value={providervalues}>
        <Sidebar></Sidebar>
        <ChatWindow></ChatWindow>
      </MyContext.Provider>
    </div>
  );
}

export default App;
