const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
// Middleware to parse URL-encoded form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory data stores
const users = [];
const exercises = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// 1. POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newUser = {
    username,
    _id: crypto.randomBytes(12).toString('hex')
  };

  users.push(newUser);
  res.json(newUser);
});

// 2. GET /api/users - Get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. POST /api/users/:_id/exercises - Add an exercise to a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Use provided date or default to current date
  const exerciseDate = date ? new Date(date) : new Date();

  const newExercise = {
    userId: _id,
    description: String(description),
    duration: Number(duration),
    date: exerciseDate
  };

  exercises.push(newExercise);

  res.json({
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date.toDateString(),
    _id: user._id
  });
});

// 4. GET /api/users/:_id/logs - Retrieve a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises.filter(ex => ex.userId === _id);

  // Filter by 'from' date (yyyy-mm-dd)
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(ex => ex.date >= fromDate);
    }
  }

  // Filter by 'to' date (yyyy-mm-dd)
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(ex => ex.date <= toDate);
    }
  }

  // Apply 'limit' parameter
  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit)) {
      userExercises = userExercises.slice(0, parsedLimit);
    }
  }

  // Format log items per test requirements
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});