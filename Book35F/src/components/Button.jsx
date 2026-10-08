export const Button=({
  variant = 'primary',   // 'primary' | 'accent' | 'secondary'
  size = 'md', // 'md' | 'sm'
  disabled = false,
  type = 'button',
  onClick,
  children,
}) => {
  
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      
    </button>
    
  );
  
}