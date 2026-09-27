import "./ChatWindow.css";
import Chat from "./Chat";

function ChatWindow() {
  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>NexaAI<i className="fa-solid fa-chevron-down"></i></span>
        <div className="userIconDiv">
            <span><i className="fa-solid fa-user"></i> </span>
        </div>
      </div>
      <Chat></Chat>

      <div className="chatInput">
        <div className="userInput">
            <input placeholder="Ask anything">
            </input>
            <div id="submit"><i className="fa-solid fa-paper-plane"></i></div>
        </div>
        <p>NexaAI can make mistakes. Check important info.</p>
      </div>


    </div>
  );
}
export default ChatWindow;
