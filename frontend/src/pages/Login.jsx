import '../App.css';
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginService } from '../features/auth/authService.jsx';
import { AlertContext } from '../context/AlertContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useContext(AlertContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { email, password } = formData;

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
      const userData = { email, password };
      const response = await loginService(userData);
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
      <h2 className="auth-subtitle">Login</h2>
      <form onSubmit={onSubmit}>
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
          placeholder="Enter your password"
          onChange={onChange}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;