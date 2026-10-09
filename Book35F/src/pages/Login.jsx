import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {Card} from '../components/Card';
import {Input} from '../components/Input';
import {Button} from '../components/Button';
import { useAuth } from '../context/AuthContext';


import '../styles/Auth.css';









export const Login = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    try {
      await login(email, password);
      navigate('/provider');
    } catch (err) {
      setSubmitError(err.message);
    }
    
  };


  
  return (
      
    <div className="auth-page">
      
      <div className="auth-card-wrap">

        <Card style={{ maxWidth: 380, width: '100%' }}>
        
          <h1 className="auth-header">Welcome back</h1>
          
          <form onSubmit={handleSubmit} className="inBtn">
            
            <Input label="Email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            
            <Input label="Password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
              />
            
  
            {submitError && <p className="field-error">{submitError}</p>}
  
            <div className="auth-btn">
              <Button type="submit" variant="accent inBtn" disabled={isLoading} >
                {isLoading ? 'Logging in...' : 'Log in'}
              </Button>
            </div>
            
            
          </form>
          
          <p className="text-caption auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          
        </Card>
        
      </div>
      
    </div>

  );
};