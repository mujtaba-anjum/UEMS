// login.js

import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student',
    department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  
  /*const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      console.log("in hzandle submit register");
      const response = await axios.post(`http://localhost:5000/auth/register`, formData);
      if (isRegister) {
        setSuccess('Registration successful! You can now login.');
        setIsRegister(false);
        setFormData({ email: '', password: '', name: '', role: 'student', department: '' });
      } else {
        onLogin(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };
  */
 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  try {
    console.log(formData);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    const response = await axios.post(
      `http://localhost:5000${endpoint}`,
      formData
    );

    if (isRegister) {
      setSuccess('Registration successful! You can now login.');
      setIsRegister(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'student',
        department: ''
      });
    } else {
      onLogin(response.data.user, response.data.token);
    }
  } catch (err) {
    setError(err.response?.data?.message || 'An error occurred');
  }
};


  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="b2021XXXX@pucit.edu.pk"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="society">Society</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department (Optional)</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="switch-link">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setSuccess('');
          }}>
            {isRegister ? 'Log in' : 'Register'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;