// ============================================
// StudentDashboard.js
// ============================================
import React, { useState, useEffect } from 'react';
import ProposeEvent from './ProposeEvent';
import EventList from './EventList';
import EventDetails from './EventDetails';
import axios from 'axios';

function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('all-events');
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/events/all');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/events/my-events');
      setMyEvents(response.data);
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  };

  const handleEventProposed = () => {
    fetchMyEvents();
    setActiveTab('my-events');
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
    fetchEvents();
  };

  return (
    <div className="dashboard">
      <h2>Student Dashboard</h2>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all-events' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-events')}
        >
          All Events
        </button>
        <button
          className={`tab ${activeTab === 'propose' ? 'active' : ''}`}
          onClick={() => setActiveTab('propose')}
        >
          Propose Event
        </button>
        <button
          className={`tab ${activeTab === 'my-events' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-events')}
        >
          My Proposed Events
        </button>
      </div>

      {activeTab === 'all-events' && (
        <EventList
          events={events}
          loading={loading}
          onEventClick={handleEventClick}
          showStatus={false}
        />
      )}

      {activeTab === 'propose' && (
        <ProposeEvent onEventProposed={handleEventProposed} />
      )}

      {activeTab === 'my-events' && (
        <EventList
          events={myEvents}
          loading={loading}
          onEventClick={handleEventClick}
          showStatus={true}
        />
      )}

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={handleCloseDetails}
          user={user}
        />
      )}
    </div>
  );
}

export default StudentDashboard;