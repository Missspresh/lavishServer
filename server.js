import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();



// Initialize express app
const app = express();


// Middleware
app.use(express.json()); 
app.use(cors()); 

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// const authenticateToken = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer token"

//   if (!token) return res.status(403).json({ message: 'Token missing' });

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: 'Invalid token' });
//     req.user = user;
//     next();
//   });
// };



// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // SQL query to find the user
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' }); // User not found
        }

        const user = results[0];

        // Compare password (Assuming passwords are stored as plain text. Use hashing in production!)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token with user id, name, and email
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email // Add user email to the payload
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token }); // Respond with success and token
    });
});

// Register endpoint
app.post('/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // Simple validation
    if (!email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Insert into database
    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, password], (err, result) => {
        if (err) {
            console.error('Database insertion error:', err);
            return res.status(500).json({ message: 'Database error.' });
        }

        // Sign the JWT
        const token = jwt.sign({ id: result.insertId, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'User registered successfully!', token }); // Include the token in the response if needed
    });
});


// app.get('/profile', authenticateToken, (req, res) => {
//     db.query('SELECT email FROM users WHERE id = ?', [req.user.id], (err, results) => {
//       if (err || results.length === 0) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       const user = results[0];
//       res.json({
//         email: user.email
//       });
//     });
//   });


const PORT = process.env.PORT || 3306;
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
