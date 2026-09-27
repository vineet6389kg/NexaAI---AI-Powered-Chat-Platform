import "./Sidebar.css";
import geminiLogo from "./assets/gemini.svg";

function Sidebar(){
    return(
        <section className="sidebar">
            
            <button>
               <img src={geminiLogo} alt="Gemini Logo" width="50" height="50" className="logo" />
                <i className="fa-solid fa-pen-to-square"></i>
            </button>


          

            <ul>
                <li>History1</li>
                <li>History1</li>
                <li>History1</li>
            </ul>


      

            <div className="sign">

                <p> By Me &hearts; </p>

            </div>
        </section>
    )
};

export default Sidebar;