// Install necessary packages: express, mysql2 (MySQL driver), body-parser

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Create a connection to MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schedule_db'
});

// Connect to MySQL
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware to parse JSON body
app.use(bodyParser.json());

// API endpoints for CRUD operations
// GET all schedule entries
app.get('/api/schedule', (req, res) => {
    connection.query('SELECT * FROM schedule', (err, results) => {
        if (err) {
            console.error('Error fetching schedule: ', err);
            res.status(500).json({ error: 'Failed to fetch schedule' });
            return;
        }
        res.json(results);
    });
});

// POST a new schedule entry
app.post('/api/schedule', (req, res) => {
    const { time, amount } = req.body;
    connection.query('INSERT INTO schedule (time, amount) VALUES (?, ?)', [time, amount], (err, result) => {
        if (err) {
            console.error('Error adding schedule: ', err);
            res.status(500).json({ error: 'Failed to add schedule' });
            return;
        }
        res.json({ message: 'Schedule added successfully', id: result.insertId });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
