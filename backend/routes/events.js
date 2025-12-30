const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/propose', auth, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      organizer: req.userId,
      status: 'pending'
    });

    await event.save();
    res.status(201).json({ message: 'Event proposed successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'approved' };
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/pending', auth, isAdmin, async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .populate('organizer', 'name email role')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-events', auth, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.userId })
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('registeredParticipants', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'approved';
    await event.save();

    const users = await User.find({});
    const targetEmails = users
      .filter(user => {
        if (event.targetAudience.includes('all')) return true;
        if (event.targetAudience.includes('students') && user.role === 'student') return true;
        if (event.targetAudience.includes('faculty') && user.role === 'faculty') return true;
        if (event.targetAudience.includes('specific_department') && user.department === event.department) return true;
        return false;
      })
      .map(user => user.email);

    if (targetEmails.length > 0) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: targetEmails.join(','),
        subject: `New Event: ${event.title}`,
        html: `
          <h2>New Event Announcement</h2>
          <h3>${event.title}</h3>
          <p><strong>Description:</strong> ${event.description}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event.time}</p>
          <p><strong>Venue:</strong> ${event.venue}</p>
          <p><strong>Organizer:</strong> ${event.organizer.name}</p>
          <p>Login to the system to register for this event!</p>
        `
      });
    }

    res.json({ message: 'Event approved and notifications sent', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'rejected';
    event.rejectionReason = req.body.reason || 'No reason provided';
    await event.save();

    res.json({ message: 'Event rejected', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot register for unapproved event' });
    }

    if (event.registeredParticipants.includes(req.userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    if (event.maxParticipants && event.registeredParticipants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.registeredParticipants.push(req.userId);
    await event.save();

    res.json({ message: 'Registered successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;