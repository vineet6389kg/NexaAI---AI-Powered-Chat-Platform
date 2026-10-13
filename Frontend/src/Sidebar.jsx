import "./Sidebar.css";
import geminiLogo from "./assets/gemini.svg";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid";

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats} = useContext(MyContext);

    const getAllThreads = async () => {

        try {
           const response = await fetch("http://localhost:8080/api/thread");
           const res = await response.json();
           const filterdData = res.map(thread => ({threadId: thread.threadId, title: thread.title}));
           console.log(filterdData);
           setAllThreads(filterdData); 
        }catch(err) {
            console.log(err);
        }
         
    };

    useEffect(() => {
        getAllThreads();
    },[currThreadId])

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async(newThreadId) => {
      setCurrThreadId(newThreadId);

      try {

        const response = await fetch(`http://localhost:8080/api/thread/${newThreadId}`);
        const res = await response.json();
          console.log(res);
          setPrevChats(res);
          setNewChat(false);
          setReply(null);

      }catch(err){
        console.log(err);
      }
    }
 



  return (
    <section className="sidebar">
      <button onClick={createNewChat}>
        <img
          src={geminiLogo}
          alt="Gemini Logo"
          width="50"
          height="50"
          className="logo"
        />
        <span>
          {" "}
          <i className="fa-solid fa-pen-to-square"></i>{" "}
        </span>
      </button>

      <ul className="history">
      {
        allThreads?.map((thread, idx) => (
            <li key={idx}
              onClick={ (e) => changeThread(thread.threadId)}
            >{thread.title}</li>
        ))
      }
      </ul>

      <div className="sign">
        <p> By Me &hearts; </p>
      </div>
    </section>
  );
}

export default Sidebar;
