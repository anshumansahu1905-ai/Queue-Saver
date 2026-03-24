const express = require('express');
const cors = require('cors');

const app = express();
const authRoutes = require('./routes/authroutes');
const queueRoutes = require('./routes/queueroutes');


app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'QueueSaver API is running 🚀' });
});

module.exports = app;
