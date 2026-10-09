
import { Link } from 'react-router-dom';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Logo} from '../components/Logo';
import {NavBar} from "../components/NavBar";
import {TopBar} from "../components/TopBar";



import '../styles/Landing.css';






export const LandingPage=()=>{
  
  return (
    
    <div>
      

      <TopBar />
      
      <NavBar />

      
      
      <div id="home" className="hero">

        <p className="text-display">
          Appointment booking, made simple and seamless
        </p>
        
        <p style={{ marginTop: 10 }}>
          Set your hours once. Share a link. Let people book straight into
          your calendar.
        </p>

        <div className="hero-ctas">
          
          <Link to="/signup">
            <Button variant="accent">
              Get Started
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="primary">
              Log In
            </Button>
          </Link>
          
        </div>
        
      </div>

      
      
      <div id="about" className="how-it-works">
        
        <Card>
          <h2>For Providers</h2>
            <p>Set your availability </p>
            <p>Share a link </p>
            <p>Get bookings</p>
        </Card>
        
        <Card>
          <h2>For Customers</h2>
          <p>
            Click a link. Choose a time. Confirm your booking.
          </p>
        </Card>
        
      </div>
      
      
    </div>
    
  );
}