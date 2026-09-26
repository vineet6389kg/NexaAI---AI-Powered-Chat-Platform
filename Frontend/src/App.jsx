import "./App.css";
import Sidebar from "./SideBar";
import ChatWindow from "./ChatWindow";
import { MyContext } from "./MyContext.jsx";

function App() {
  const providervalues = {}; // Passing Values
  return (
    <div className="main">
      <MyContext.Provider values="{providerValues}">
        <Sidebar></Sidebar>
        <ChatWindow></ChatWindow>
      </MyContext.Provider>
    </div>
  );
}

export default App;
