export const Card = (
  { children, style, className = '' }
) => {
  
  return (
    
    <div 
      className={`card${className ? ` ${className}` : ''}`}
      style={style}
      >
      
      {children}
      
    </div>
  );
  
}