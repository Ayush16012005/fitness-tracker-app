require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const goalsRoutes = require('./routes/goals');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/landing.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/workout', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/workout.html'));
});

app.get('/goals', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/goals.html'));
});

app.get('/progress', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/progress.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

module.exports = app;
