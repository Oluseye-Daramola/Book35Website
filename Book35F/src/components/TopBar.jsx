import { FaFacebookF, FaLinkedinIn, FaInstagram } from 'react-icons/fa';




export const TopBar=() =>{
  return (
    
    <div className="flex flex-col sm:flex-row justify-between items-center gap-1 bg-[var(--color-ink-navy)] text-[var(--color-off-white)] text-xs px-6 py-2 text-center">
      
      <span>info@book35.com | +2347062736868</span>
      
      <div className="flex gap-3">
        <a href="#" aria-label="Facebook"><FaFacebookF /></a>
        <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
        <a href="#" aria-label="Instagram"><FaInstagram /></a>
      </div>
      
    </div>
  );
}