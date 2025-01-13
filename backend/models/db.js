const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Path to SQLite database file
const dbPath = process.env.DATABASE_URL;

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
  }
});

// Create table for users if it doesn't exist
const createUserTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      salary REAL DEFAULT 0,
      balance REAL DEFAULT 0
    );
  `;
  
  db.run(query, (err) => {
    if (err) {
      console.error('Error creating user table:', err.message);
    } else {
      console.log('User table is ready');
    }
  });
};

// Function to register a new user
const registerUser = (username, password, salary = 0, balance = 0, callback) => {
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return callback(err);

    const query = 'INSERT INTO users (username, password, salary, balance) VALUES (?, ?, ?, ?)';
    const values = [username, hashedPassword, salary, balance];

    db.run(query, values, function (err) {
      if (err) return callback(err);
      callback(null, this.lastID); // Return the ID of the new user
    });
  });
};

// Authenticate user (login)
const authenticateUser = (username, password, callback) => {
  const query = 'SELECT * FROM users WHERE username = ?';
  const values = [username];

  db.get(query, values, (err, user) => {
    if (err) return callback(err);

    if (!user) return callback(null, false); // User not found

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return callback(err);
      if (isMatch) {
        callback(null, user); // Password matches
      } else {
        callback(null, false); // Password incorrect
      }
    });
  });
};

// Get all workers
const getWorkers = (callback) => {
  const query = 'SELECT * FROM users';

  db.all(query, [], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows); // Return the rows (workers)
  });
};

// Pay a worker by updating their balance
const payWorker = (workerId, amount, callback) => {
  const query = 'UPDATE users SET balance = balance + ? WHERE id = ?';
  const values = [amount, workerId];

  db.run(query, values, function (err) {
    if (err) return callback(err);
    if (this.changes === 0) {
      return callback(new Error('Worker not found or payment failed.'));
    }
    callback(null, { success: true });
  });
};

// Export the database functions
module.exports = {
  db,
  createUserTable,
  registerUser,
  authenticateUser,
  getWorkers,
  payWorker,
};
