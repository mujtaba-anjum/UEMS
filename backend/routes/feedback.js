const express = require('express');
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.registeredParticipants.includes(req.userId)) {
      return res.status(403).json({ message: 'You must attend the event to give feedback' });
    }

    const existingFeedback = await Feedback.findOne({ event: eventId, user: req.userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }

    const feedback = new Feedback({
      event: eventId,
      user: req.userId,
      rating,
      comment
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const avgRating = feedbacks.length
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    res.json({ feedbacks, avgRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.userId })
      .populate('event', 'title date')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;