// ============================================
// EventDetails.js
// ============================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EventDetails({ event, onClose, user }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkRegistration();
    fetchFeedbacks();
  }, [event]);

  const checkRegistration = () => {
    const registered = event.registeredParticipants?.some(
      (p) => p._id === user.id || p === user.id
    );
    setIsRegistered(registered);
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/feedback/event/${event._id}`);
      setFeedbacks(response.data.feedbacks);
      setAvgRating(response.data.avgRating);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`http://localhost:5000/events/${event._id}/register`);
      setMessage('Successfully registered for the event!');
      setIsRegistered(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error registering for event');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/feedback', {
        eventId: event._id,
        ...feedbackForm
      });
      setMessage('Feedback submitted successfully!');
      setFeedbackForm({ rating: 5, comment: '' });
      fetchFeedbacks();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting feedback');
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const isPastEvent = new Date(event.date) < new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{event.title}</h2>
        
        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {event.time}</p>
          <p><strong>Venue:</strong> {event.venue}</p>
          <p><strong>Organizer:</strong> {event.organizer?.name}</p>
          {event.maxParticipants && (
            <p>
              <strong>Capacity:</strong> {event.registeredParticipants?.length || 0}/{event.maxParticipants}
            </p>
          )}
          <p style={{ marginTop: '15px' }}>{event.description}</p>
        </div>

        {event.status === 'approved' && !isPastEvent && !isRegistered && (
          <button className="btn btn-success" onClick={handleRegister}>
            Register for Event
          </button>
        )}

        {isRegistered && !isPastEvent && (
          <div className="success-message">You are registered for this event!</div>
        )}

        {/* Feedback Section */}
        <div className="feedback-section">
          <h3>Feedback & Reviews</h3>
          {avgRating > 0 && (
            <p style={{ marginBottom: '15px' }}>
              <strong>Average Rating:</strong> {renderStars(Math.round(avgRating))} ({avgRating.toFixed(1)}/5)
            </p>
          )}

          {isRegistered && isPastEvent && (
            <form onSubmit={handleFeedbackSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Your Rating</label>
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Your Comments</label>
                <textarea
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  rows="3"
                  required
                  placeholder="Share your experience..."
                />
              </div>

              <button type="submit" className="btn">Submit Feedback</button>
            </form>
          )}

          {feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <div key={feedback._id} className="feedback-item">
                <div className="rating">{renderStars(feedback.rating)}</div>
                <div className="user">{feedback.user?.name}</div>
                <div className="comment">{feedback.comment}</div>
                <small style={{ color: '#999' }}>
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </small>
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>No feedback yet</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;