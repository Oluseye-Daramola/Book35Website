import { useId } from 'react';




export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  multiline = false,
  options,   // to define inputs types
  required = false,
  ...rest   // passes min, accept, autoFocus, maxLength, etc.
}) => {

  
  const id = useId();
  
  const className = `field-input${error ? ' has-error' : ''}`;


    let control;
  
  if (multiline) {
    control = (
      <textarea
        id={id}
        rows={3}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      />
    );
    
  } else if (type === 'select') {
    
    control = (
      <select id={id} className={className} value={value} onChange={onChange} required={required} {...rest}>
        {options?.map((opt) => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    );
    
  } else if (type === 'file') {
    control = (
      <input id={id} type="file" className={className} onChange={onChange} required={required} {...rest} />
    );
    
  } else {
    control = (
      <input
        id={id}
        type={type}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      />
    );
    
  }


  
  
  return (
    
    <div className="field">
      
      {label && (
        <label htmlFor={id} className="field-label text-label">
          {label}
        </label>
      )}
      
      {control}
      
      {
        hint && !error && <div className="field-hint">
        {hint}
      </div>
      }
      
      {
        error && <div className="field-error">
        {error}
      </div>
      }
      
    </div>
  );
  
}