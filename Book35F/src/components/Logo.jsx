
import logoImg from '../assets/book35_logo_full.png';
import {Link} from "react-router-dom";

import '../styles/Landing.css';





export const Logo=()=>{
  return (
    
    <Link to="/" className="logo">
      <img src={logoImg} alt="Book35" className="h-8 w-auto" />
    </Link>
    
  );
}