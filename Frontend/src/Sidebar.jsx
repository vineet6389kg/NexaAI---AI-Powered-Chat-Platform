import "./Sidebar.css";
import geminiLogo from "./assets/gemini.svg";

function Sidebar(){
    return(
        <section className="sidebar">
            
            <button>
               <img src={geminiLogo} alt="Gemini Logo" width="50" height="50" className="logo" />
               <span> <i className="fa-solid fa-pen-to-square"></i> </span> 
            </button>


          

            <ul className="history">
                <li>thread1</li>
                <li>thread2</li>
                <li>thread3</li>
            </ul>


      

            <div className="sign">

                <p> By Me &hearts; </p>

            </div>
        </section>
    )
};

export default Sidebar;