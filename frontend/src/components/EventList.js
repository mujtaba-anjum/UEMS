  // EventList.js
  import React from 'react';

  function EventList({ events, loading, onEventClick, showStatus }) {
    if (loading) {
      return <div className="loading">Loading events...</div>;
    }

    if (events.length === 0) {
      return <div className="empty-state">No events found</div>;
    }

    return (
      <div className="event-grid">
        {events.map((event) => (
          <div
            key={event._id}
            className="event-card"
            onClick={() => onEventClick(event)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{event.title}</h3>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {event.time}</p>
            <p><strong>Venue:</strong> {event.venue}</p>
            <p>{event.description.substring(0, 100)}...</p>
            
            {event.maxParticipants && (
              <p>
                <strong>Capacity:</strong> {event.registeredParticipants?.length || 0}/{event.maxParticipants}
              </p>
            )}

            {showStatus && (
              <span className={`status-badge status-${event.status}`}>
                {event.status.toUpperCase()}
              </span>
            )}

            {event.status === 'rejected' && event.rejectionReason && (
              <p style={{ color: '#dc3545', marginTop: '10px', fontSize: '12px' }}>
                <strong>Reason:</strong> {event.rejectionReason}
              </p>
            )}

            <div className="event-actions">
              <button
                className="btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  export default EventList;