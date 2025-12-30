// ============================================
// ProposeEvent.js
// ============================================
import React, { useState } from 'react';
import axios from 'axios';

function ProposeEvent({ onEventProposed }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    targetAudience: ['all'],
    department: '',
    maxParticipants: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleAudienceChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      setFormData({ ...formData, targetAudience: ['all'] });
    } else {
      setFormData({ ...formData, targetAudience: [value] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/events/propose', formData);
      setSuccess('Event proposed successfully! Waiting for admin approval.');
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        targetAudience: ['all'],
        department: '',
        maxParticipants: ''
      });
      setTimeout(() => {
        onEventProposed();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error proposing event');
    }
  };

  return (
    <div>
      <h3>Propose New Event</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter event title"
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Describe your event..."
          />
        </div>

        <div className="form-group">
          <label>Event Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>Event Time *</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Venue *</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            placeholder="Event location"
          />
        </div>

        <div className="form-group">
          <label>Target Audience *</label>
          <select
            value={formData.targetAudience[0]}
            onChange={handleAudienceChange}
          >
            <option value="all">All University Members</option>
            <option value="students">Students Only</option>
            <option value="faculty">Faculty Only</option>
            <option value="specific_department">Specific Department</option>
          </select>
        </div>

        {formData.targetAudience[0] === 'specific_department' && (
          <div className="form-group">
            <label>Department Name *</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              placeholder="e.g., Computer Science"
            />
          </div>
        )}

        <div className="form-group">
          <label>Maximum Participants (Optional)</label>
          <input
            type="number"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            placeholder="Leave empty for unlimited"
            min="1"
          />
        </div>

        <button type="submit" className="btn">
          Propose Event
        </button>
      </form>
    </div>
  );
}

export default ProposeEvent;
