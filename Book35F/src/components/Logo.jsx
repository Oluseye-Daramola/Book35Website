
import logoImg from '../assets/book35_logo_full.png';

import '../styles/Landing.css';





export const Logo=()=>{
  return (
    
    <span className="logo">
      <img src={logoImg} alt="Book35" className="h-8 w-auto" />
    </span>
    
  );
}