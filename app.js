const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const cronService = require('./services/cron');
require('dotenv').config();

// Retrieve MongoDB URI from environment variables
const mongoURI = "MONGO_URI=mongodb+srv://your_username:your_password@cluster0.cen1xf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const searchesRouter = require('./routes/searches');
const moviesRouter = require('./routes/movies');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/searches', searchesRouter);
app.use('/movies', moviesRouter);

// Catch 404 errors
app.use((req, res, next) => {
    res.status(404).json({ ok: false });
});

// Error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.DEBUG === 'true' ? err : {};
    res.status(err.status || 500).json({ status: err.status || 500, error: err.message });
});

// MongoDB connection
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin'
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to com_watch database');
    app.listen(3000, () => {
        console.log('Server is running on port 3000:', new Date().toTimeString());
    });
});

// Cron job
cron.schedule('0 */15 * * * *', () => {
    console.log('Running getNoResultSuggestion every 15 minutes');
    cronService.getNoResultSuggestion();
});

module.exports = app;
