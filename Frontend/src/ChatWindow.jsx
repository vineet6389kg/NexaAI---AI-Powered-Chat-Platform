import "./ChatWindow.css";
import Chat from "./Chat";
import { MyContext } from "./MyContext";
import { useContext, useState } from "react";

function ChatWindow() {
  const { prompt, setPrompt, reply, setReply,currThreadId } = useContext(MyContext);

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>
          NexaAI<i className="fa-solid fa-chevron-down"></i>
        </span>
        <div className="userIconDiv">
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>{" "}
          </span>
        </div>
      </div>
      <Chat></Chat>

      <div className="chatInput">
        <div className="inputBox">
          <input
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></input>
          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p>NexaAI can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
export default ChatWindow;
