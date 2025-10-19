import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Gallery from './pages/Gallery.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
