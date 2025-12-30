// ============================================
// AdminDashboard.js
// ============================================
import React, { useState, useEffect } from 'react';
import EventList from './EventList';
import axios from 'axios';

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingEvents();
    fetchAllEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/events/pending');
      setPendingEvents(response.data);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/events/all');
      setAllEvents(response.data);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      await axios.patch(`http://localhost:5000/events/${eventId}/approve`);
      alert('Event approved and notifications sent!');
      fetchPendingEvents();
      fetchAllEvents();
    } catch (error) {
      alert('Error approving event: ' + error.response?.data?.message);
    }
  };

  const handleReject = async (eventId) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/events/${eventId}/reject`, { reason: rejectionReason });
      alert('Event rejected');
      setSelectedEvent(null);
      setRejectionReason('');
      fetchPendingEvents();
      fetchAllEvents();
    } catch (error) {
      alert('Error rejecting event: ' + error.response?.data?.message);
    }
  };

  const renderEventCard = (event) => (
    <div key={event._id} className="event-card">
      <h3>{event.title}</h3>
      <p><strong>Organizer:</strong> {event.organizer?.name} ({event.organizer?.role})</p>
      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> {event.time}</p>
      <p><strong>Venue:</strong> {event.venue}</p>
      <p><strong>Description:</strong> {event.description.substring(0, 100)}...</p>
      <span className={`status-badge status-${event.status}`}>
        {event.status.toUpperCase()}
      </span>

      {event.status === 'pending' && (
        <div className="event-actions">
          <button
            className="btn btn-success"
            onClick={() => handleApprove(event._id)}
          >
            Approve
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setSelectedEvent(event)}
          >
            Reject
          </button>
        </div>
      )}

      {event.status === 'rejected' && event.rejectionReason && (
        <p style={{ color: '#dc3545', marginTop: '10px' }}>
          <strong>Reason:</strong> {event.rejectionReason}
        </p>
      )}
    </div>
  );

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Events ({pendingEvents.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Events ({allEvents.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="event-grid">
          {activeTab === 'pending' && (
            pendingEvents.length === 0 ? (
              <div className="empty-state">No pending events</div>
            ) : (
              pendingEvents.map(renderEventCard)
            )
          )}

          {activeTab === 'all' && (
            allEvents.length === 0 ? (
              <div className="empty-state">No events found</div>
            ) : (
              allEvents.map(renderEventCard)
            )
          )}
        </div>
      )}

      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Reject Event: {selectedEvent.title}</h2>
            <div className="form-group">
              <label>Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => handleReject(selectedEvent._id)}
              >
                Confirm Rejection
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedEvent(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;