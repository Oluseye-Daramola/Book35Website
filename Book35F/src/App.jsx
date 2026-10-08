
import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';


import {LandingPage} from './pages/LandingPage';
import {SignUp} from './pages/SignUp';
import {Login} from './pages/Login';
import {ProviderDashboard} from './pages/ProviderDashboard';
import {BookingPage} from './pages/BookingPage';

//import {DesignDemo} from "./pages/DesignDemo";

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './utils/ProtectedRoute';

import './styles/Global.css'









export const App = () => {
  
  return (

    <AuthProvider>
      <BrowserRouter>
        
        <Routes>
          
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/signup" element={<SignUp />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route path="/provider" element={
            <ProtectedRoute>
              <ProviderDashboard />
            </ProtectedRoute>
          }
          />
          
          <Route path="/book/:slug" element={<BookingPage />} />
  
          {/**
          <Route path="/designDemo" element={<DesignDemo />} />
          **/}
          
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
  );
  
}