import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


//imported variables and defined style classess
import './styles/Global.css';
import './styles/Components.css';


import {App} from './App.jsx'; 





createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    
    <App />
    
  </StrictMode>,
  
); 
