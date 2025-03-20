const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect('mongodb+srv://<Dhanush>:<Dhanush05>@cluster0.3ynp0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('MongoDB Atlas connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

// Login route
app.post('/login', async (req, res) => {
    const { uname, upswd } = req.body;
    
    try {
        const user = await User.findOne({ username: uname });
        if (user && await bcrypt.compare(upswd, user.password)) {
            req.session.user = user;
            res.json({ success: true, message: 'Login successful!', user });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register route
app.post('/register', async (req, res) => {
    const { uname, upswd } = req.body;
    
    try {
        const existingUser = await User.findOne({ username: uname });
        if (existingUser) {
            return res.json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(upswd, 10);
        const newUser = new User({ username: uname, password: hashedPassword });
        await newUser.save();
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

// Logout API
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
