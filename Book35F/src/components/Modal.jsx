import { useEffect } from 'react';
import {Card} from './Card';




export const Modal = ({ label, onClose, dismissible = true, children }) => {
  
  // Lock page scroll while the modal exists
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Close on Escape (unless closing is blocked)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissible, onClose]);

  return (
    <div
      className="fixed inset-0 z-20 flex overflow-y-auto p-5 bg-[rgba(27,31,59,0.54)] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={label} className="relative m-auto w-full max-w-[460px]">
        <Card className="modal-card">
          {dismissible && (
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          )}
          {children}
        </Card>
        
      </div>
      
    </div>
  );
};