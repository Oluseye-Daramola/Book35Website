

export const Header = ({ title, subtitle }) => {
  
  return (
    <header>
      
      <h1>{title}</h1>
      
      {subtitle && <p className="header-subtitle">{subtitle}</p>}
      
    </header>
  );
  
}
