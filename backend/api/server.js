const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('../models/db'); // Import the SQLite database logic
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend communication
app.use(
  cors({
    origin: 'http://localhost:3000', // Replace with your front-end URL
    methods: 'GET,POST',
    credentials: true,
  })
);

// Session middleware with SQLite store
app.use(
  session({
    store: new SQLiteStore({ db: '/sessions.sqlite' }), // Persist sessions
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Important: Don't save empty sessions
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' }, // Secure in production
  })
);

// Debugging sessions
app.use((req, res, next) => {
  console.log('Session Data:', req.session);
  next();
});

// Create the user table when the app starts
(async () => {
  console.log('Setting up database...');
})();

// Signup route (user registration)
app.post('/signup', async (req, res) => {
  const { username, password, salary } = req.body;

  if (!username || !password || salary === undefined) {
    return res.status(400).json({ error: 'Please provide username, password, and salary.' });
  }

  try {
    const userId = await db.registerUser(username, password, salary, 0);
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide both username and password.' });
  }

  try {
    const user = await db.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.userId = user.id; // Store user ID in session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Error saving session' });
      }
      console.log('Session after login:', req.session);
      res.status(200).json({ message: 'User logged in successfully' });
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});



// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.status(200).json({ message: 'User logged out successfully' });
  });
});

// Fetch all workers (users)
app.get('/workers', async (req, res) => {
  try {
    const workers = await db.getWorkers();
    res.status(200).json({ workers });
  } catch (err) {
    console.error('Error fetching workers:', err.message);
    res.status(500).json({ error: 'Failed to retrieve workers.' });
  }
});

// Payment route (pay worker)
app.post('/pay', async (req, res) => {
  const { workerId, amount } = req.body;

  if (!workerId || amount === undefined) {
    return res.status(400).json({ error: 'Worker ID and amount are required.' });
  }

  try {
    await db.payWorker(workerId, amount);
    res.status(200).json({ success: true, message: 'Payment successful!' });
  } catch (err) {
    console.error('Error processing payment:', err.message);
    res.status(500).json({ error: 'Error processing payment.' });
  }
});

app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      username: user.username,
      salary: user.salary,
      balance: user.balance,
    });
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ error: 'Error fetching profile data.' });
  }
});



// Delete user route
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/workers/balance', async (req, res) => {
  try {
    const workers = await db.getWorkers(); // Assuming it fetches all workers

    const workersWithBalance = workers.map(worker => ({
      id: worker.id,
      username: worker.username,
      salary: worker.salary,
      balance: worker.balance
    }));

    res.status(200).json({ workers: workersWithBalance });
  } catch (err) {
    console.error('Error fetching worker balances:', err.message);
    res.status(500).json({ error: 'Failed to retrieve worker balances.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
