import "./Chat.css";
import { useContext } from "react";
import { MyContext } from "./MyContext";

function Chat() {
  const { newChat } = useContext(MyContext);
  return (
    <>
      {newChat && <h1>Start a new Chat!</h1>}
      <div className="chats">
        <div className="userDiv">
          <p className="userMessage"> User Message</p>
        </div>
        <div className="gitDiv">
          <p className="gptMessage"> GPT generated Message</p>
        </div>
      </div>
    </>
  );
}

export default Chat;
