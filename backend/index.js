require('dotenv').config()
const express = require('express');
const cors = require("cors");
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

const db = mysql.createConnection({
    host: '192.168.0.102',
    user: 'nicholas',
    password: 'senior-project',
    database: 'homelab'
})

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err)
        return
    }
    console.log('Connected to Pi 2 MariaDB')
})

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
)

app.get("/", (req, res) => {
    res.send("Welcome to the node server...")
});

app.get("/api/hello", (req, res) => {
    res.json({message: "Hello from the API"})
})

app.get("/api/test", (req, res) => {
    db.query("SELECT * FROM test", (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(results)
    })
})

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})