import '../App.css';
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerService} from '../features/auth/authService.jsx';
import { AlertContext } from '../context/AlertContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useContext(AlertContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { name, email, password } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = { name, email, password };
      const response = await registerService(userData);
      login(response);
      navigate('/');
    } catch (error) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        error.toString();
      showAlert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Shiromages</h1>
      <h2 className="auth-subtitle">Register</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          name="name"
          value={name}
          placeholder="Enter your name"
          onChange={onChange}
          required
        />
        <input
          type="email"
          name="email"
          value={email}
          placeholder="Enter your email"
          onChange={onChange}
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          placeholder="Enter a password"
          onChange={onChange}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;