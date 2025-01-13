const express = require('express');
const session = require('express-session');
const db = require('../models/db'); // Import the SQLite database logic
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'https://avs-services.vercel.app', // Replace with your front-end URL
  methods: 'GET,POST',
  credentials: true,
}));

// Use express-session for user sessions
app.use(session({
  secret: 'your-secret-key',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set to true in production with HTTPS
}));

// Create the user table when the app starts
db.createUserTable();

// Signup route (user registration)
app.post('/signup', (req, res) => {
  const { username, password, salary } = req.body;

  if (!username || !password || salary === undefined) {
    return res.status(400).json({ error: 'Please provide username, password, and salary.' });
  }

  db.registerUser(username, password, salary, 0, (err, userId) => {
    if (err) {
      console.error('Error during registration:', err.message);
      return res.status(500).json({ error: 'An error occurred during registration.' });
    }
    res.status(201).json({ message: 'User registered successfully', userId });
  });
});

// Login route (user authentication)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide both username and password.' });
  }

  db.authenticateUser(username, password, (err, user) => {
    if (err) {
      console.error('Error during login:', err.message);
      return res.status(500).json({ error: 'An error occurred during login.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.userId = user.id;

    res.status(200).json({ message: 'User logged in successfully' });
  });
});

// Fetch all workers (users)
app.get('/workers', (req, res) => {
  db.getWorkers((err, workers) => {
    if (err) {
      console.error('Error fetching workers:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve workers.' });
    }
    res.status(200).json({ workers });
  });
});

// Payment route (pay worker)
app.post('/pay', (req, res) => {
  const { workerId, amount } = req.body;

  if (!workerId || amount === undefined) {
    return res.status(400).json({ error: 'Worker ID and amount are required.' });
  }

  db.payWorker(workerId, amount, (err) => {
    if (err) {
      console.error('Error processing payment:', err.message);
      return res.status(500).json({ error: 'Error processing payment.' });
    }
    res.status(200).json({ success: true, message: 'Payment successful!' });
  });
});

// Profile route
app.get('/profile', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User not logged in.' });
  }

  db.getUserById(userId, (err, user) => {
    if (err) {
      console.error('Error fetching profile:', err.message);
      return res.status(500).json({ error: 'Error fetching profile data.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ user });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
