import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext.jsx';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import Gallery from './pages/Gallery.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthLoading } = useContext(AuthContext);
  if (isAuthLoading) return <div>Loading...</div>; // or a spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Gallery />
                  </ProtectedRoute>
                }
              />

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
