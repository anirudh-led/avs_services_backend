const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Get the database file path from environment variables (default to 'sqlite3-database.db' if not set)
const dbFilePath = process.env.DB_FILE || path.join(__dirname, 'public', 'sqlite3-database.db');  // Providing a fallback

// Ensure the directory exists
const dir = path.dirname(dbFilePath);
const fs = require('fs');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open a connection to the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database at', dbFilePath);
  }
});

// Create table for users if it doesn't exist (run this manually once or upon app startup)
const createUserTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      salary REAL DEFAULT 0
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

// Register a new user with a salary
const registerUser = (username, email, password, salary = 0, callback) => {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return callback(err);

    const query = 'INSERT INTO users (username, email, password, salary) VALUES (?, ?, ?, ?)';
    db.run(query, [username, email, hashedPassword, salary], function(err) {
      if (err) return callback(err);
      callback(null, this.lastID); // Return the ID of the new user
    });
  });
};

// Authenticate a user (login)
const authenticateUser = (username, password, callback) => {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  const query = 'SELECT * FROM users WHERE username = ?'; // Query by username
  db.get(query, [username], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, false); // User not found

    // Compare entered password with stored hashed password
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

// Close the database connection when done
const closeDb = () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing SQLite database:', err.message);
    } else {
      console.log('Closed SQLite database connection');
    }
  });
};

// Export the database functions
module.exports = {
  db,
  createUserTable,
  registerUser,
  authenticateUser,
  closeDb,
};
