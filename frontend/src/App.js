import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="navbar">
        <h1>PUCIT Event Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666' }}>Welcome, {user.name} ({user.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="container">
        {user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </div>
    </div>
  );
}

export default App;