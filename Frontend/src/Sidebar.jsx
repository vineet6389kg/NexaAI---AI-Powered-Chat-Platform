import "./Sidebar.css";
import geminiLogo from "./assets/gemini.svg";

function Sidebar(){
    return(
        <section className="sidebar">
            {/* new chat button */}
            <button>
               <img src={geminiLogo} alt="Gemini Logo" width="50" height="50" />
                <i className="fa-solid fa-pen-to-square"></i>
            </button>


            {/* history */}


            {/* sign */}
        </section>
    )
};

export default Sidebar;