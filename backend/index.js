require('dotenv').config()
const express = require('express');
const cors = require("cors");
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.get("/api/devices", (req, res) => {
    db.query("SELECT * FROM devices", (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(results)
    })
})

app.get("/api/count", (req, res) => {
    db.query("SELECT COUNT(*) as total FROM devices", (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json({ total: results[0].total })
    })
})

app.get("/api/myip", (req, res) => {
    res.json({ ip: req.ip.replace('::ffff:', '') })
})

app.post("/api/checkin", (req, res) => {
    const { name } = req.body
    const ip = req.ip.replace('::ffff:', '')
    db.query(
        `INSERT INTO devices (ip, active, name) VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1`,
        [ip, name],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ success: true })
        }
    )
})

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})