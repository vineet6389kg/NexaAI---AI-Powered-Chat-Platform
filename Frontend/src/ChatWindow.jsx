import "./ChatWindow.css";
import Chat from "./Chat";
import { MyContext } from "./MyContext";
import { useContext, useState } from "react";
import {HashLoader, ScaleLoader, SyncLoader} from "react-spinners";

function ChatWindow() {
  const { prompt, setPrompt, reply, setReply,currThreadId } = useContext(MyContext);

  const getReply = async () => {
    console.log("message", prompt, "threadId", currThreadId);
    const options = {
        method: "post",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify( {
            message: prompt,
            threadId: currThreadId 
        })
    };

    try{
       const response =  await fetch("http://localhost:8080/api/chat", options);
       const res = await response.json();
       console.log(res);   
       setReply(res.reply);

    }catch(err){
        console.log(err);
    }
  }

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

      <HashLoader color="#fff">

      </HashLoader>

      <div className="chatInput">
        <div className="inputBox">
          <input
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
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
