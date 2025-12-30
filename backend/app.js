
// app.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { connectToMongo, getDb } = require('.//config/db');
const cors = require('cors');

// Make sure you have these npm packages installed:
// npm install bcrypt jsonwebtoken

// ============================================
// AUTHENTICATION ROUTES

// ============================================
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// Register new user
app.post("/auth/register", async (req, res) => {
  try {
    console.log("in auth/register" , req.body);
    const { email, password, name, role, department } = req.body;
    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Email validation (PUCIT format)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@pucit\.edu\.pk$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please use a valid PUCIT email address" });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const db = getDb();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const newUser = {
      email,
      password: hashedPassword,
      name,
      role, // student, faculty, society, admin
      department: department || null,
      createdAt: new Date(),
      isActive: true
    };

    // Insert user
    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: "Registration successful! You can now login.",
      userId: result.insertedId
    });

  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const db = getDb();
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      "your_secret_key", // Use environment variable in production
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    };

    res.json({
      message: "Login successful",
      token,
      user: userData
    });

  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ============================================
// EVENT ROUTES
// ============================================

// Propose new event (Student/Faculty/Society)
app.post("/events/propose", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");
    
    const {
      title,
      description,
      date,
      time,
      venue,
      targetAudience,
      department,
      maxParticipants
    } = req.body;

    // Validation
    if (!title || !description || !date || !time || !venue || !targetAudience) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate date (must be in future)
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    const db = getDb();
    const eventsCollection = db.collection("events");
    const usersCollection = db.collection("users");

    // Get organizer details
    const organizer = await usersCollection.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Create event object
    const newEvent = {
      title,
      description,
      date: new Date(date),
      time,
      venue,
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
      department: department || null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        role: organizer.role
      },
      status: "pending", // pending, approved, rejected
      rejectionReason: null,
      registeredParticipants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await eventsCollection.insertOne(newEvent);

    res.status(201).json({
      message: "Event proposed successfully! Waiting for admin approval.",
      eventId: result.insertedId
    });

  } catch (error) {
    console.error("Error proposing event:", error);
    res.status(500).json({ message: "Server error while proposing event" });
  }
});

// Get all approved events (for students to browse)
app.get("/events/all", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, "your_secret_key");

    const db = getDb();
    const eventsCollection = db.collection("events");

    // Get all approved events sorted by date
    const events = await eventsCollection
      .find({ status: "approved" })
      .sort({ date: 1 })
      .toArray();

    res.json(events);

  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});

// Get user's proposed events
app.get("/events/my-events", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");

    const db = getDb();
    const eventsCollection = db.collection("events");

    // Get all events created by this user
    const events = await eventsCollection
      .find({ "organizer._id": new ObjectId(decoded.id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(events);

  } catch (error) {
    console.error("Error fetching my events:", error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});

// Get pending events (Admin only)
app.get("/events/pending", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");

    // Check if user is admin
    const db = getDb();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const eventsCollection = db.collection("events");

    // Get all pending events
    const events = await eventsCollection
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(events);

  } catch (error) {
    console.error("Error fetching pending events:", error);
    res.status(500).json({ message: "Server error while fetching pending events" });
  }
});

// Approve event (Admin only)
app.patch("/events/:eventId/approve", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");
    const { eventId } = req.params;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // Check if user is admin
    const db = getDb();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const eventsCollection = db.collection("events");

    // Find and update event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "pending") {
      return res.status(400).json({ message: "Event is not pending approval" });
    }

    // Update event status
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $set: { 
          status: "approved",
          approvedAt: new Date(),
          approvedBy: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          updatedAt: new Date()
        } 
      }
    );

    // TODO: Send notification to event organizer (implement notification system)

    res.json({ message: "Event approved successfully" });

  } catch (error) {
    console.error("Error approving event:", error);
    res.status(500).json({ message: "Server error while approving event" });
  }
});

// Reject event (Admin only)
app.patch("/events/:eventId/reject", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");
    const { eventId } = req.params;
    const { reason } = req.body;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    // Check if user is admin
    const db = getDb();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const eventsCollection = db.collection("events");

    // Find and update event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "pending") {
      return res.status(400).json({ message: "Event is not pending approval" });
    }

    // Update event status
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $set: { 
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          updatedAt: new Date()
        } 
      }
    );

    // TODO: Send notification to event organizer

    res.json({ message: "Event rejected" });

  } catch (error) {
    console.error("Error rejecting event:", error);
    res.status(500).json({ message: "Server error while rejecting event" });
  }
});

// Register for an event
app.post("/events/:eventId/register", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");
    const { eventId } = req.params;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const db = getDb();
    const eventsCollection = db.collection("events");
    const usersCollection = db.collection("users");

    // Get event details
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "approved") {
      return res.status(400).json({ message: "This event is not approved yet" });
    }

    // Check if event date has passed
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res.status(400).json({ message: "This event has already passed" });
    }

    // Check if already registered
    const isAlreadyRegistered = event.registeredParticipants?.some(
      p => p._id.toString() === decoded.id || p.toString() === decoded.id
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // Check max participants limit
    if (event.maxParticipants) {
      const currentCount = event.registeredParticipants?.length || 0;
      if (currentCount >= event.maxParticipants) {
        return res.status(400).json({ message: "Event has reached maximum capacity" });
      }
    }

    // Get user details
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add user to registered participants
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $push: { 
          registeredParticipants: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            registeredAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ message: "Successfully registered for the event!" });

  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({ message: "Server error while registering for event" });
  }
});

// ============================================
// FEEDBACK ROUTES
// ============================================

// Submit feedback for an event
app.post("/feedback", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, "your_secret_key");
    const { eventId, rating, comment } = req.body;

    // Validation
    if (!eventId || !rating || !comment) {
      return res.status(400).json({ message: "Event ID, rating, and comment are required" });
    }

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const db = getDb();
    const eventsCollection = db.collection("events");
    const feedbackCollection = db.collection("feedback");
    const usersCollection = db.collection("users");

    // Check if event exists and user is registered
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event has passed
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate >= today) {
      return res.status(400).json({ message: "Cannot submit feedback for upcoming or current events" });
    }

    // Check if user was registered for this event
    const wasRegistered = event.registeredParticipants?.some(
      p => p._id.toString() === decoded.id
    );

    if (!wasRegistered) {
      return res.status(403).json({ message: "You must have attended the event to submit feedback" });
    }

    // Check if user already submitted feedback
    const existingFeedback = await feedbackCollection.findOne({
      eventId: new ObjectId(eventId),
      "user._id": new ObjectId(decoded.id)
    });

    if (existingFeedback) {
      return res.status(400).json({ message: "You have already submitted feedback for this event" });
    }

    // Get user details
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    // Create feedback object
    const newFeedback = {
      eventId: new ObjectId(eventId),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      rating: parseInt(rating),
      comment: comment.trim(),
      createdAt: new Date()
    };

    await feedbackCollection.insertOne(newFeedback);

    res.status(201).json({ message: "Feedback submitted successfully!" });

  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Server error while submitting feedback" });
  }
});

// Get feedback for an event
app.get("/feedback/event/:eventId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, "your_secret_key");
    const { eventId } = req.params;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const db = getDb();
    const feedbackCollection = db.collection("feedback");

    // Get all feedback for this event
    const feedbacks = await feedbackCollection
      .find({ eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate average rating
    let avgRating = 0;
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
      avgRating = totalRating / feedbacks.length;
    }

    res.json({
      feedbacks,
      avgRating: parseFloat(avgRating.toFixed(2)),
      totalFeedbacks: feedbacks.length
    });

  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Server error while fetching feedback" });
  }
});

const PORT = 5000; 
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error(" Failed to connect to MongoDB:", err);
});