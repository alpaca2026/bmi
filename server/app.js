const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const recordsRoutes = require('./routes/records');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'bmi-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', authRoutes);
app.use('/api/records', recordsRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/bmi', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'bmi.html'));
});

app.get('/graph', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'graph.html'));
});

app.listen(PORT, () => {
    console.log(`BMI算出アプリケーション起動: http://localhost:${PORT}`);
});
