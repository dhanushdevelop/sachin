const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dhanushua11:damUvSoBAPYPgeuW@cluster0.3ynp0.mongodb.net/userDB')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB Atlas connection error:', err));

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    altPhone: String,
    paymentMethod: String,
    filePath: String,
    numPages: Number,
    numCopies: Number,
    uploadedAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
    console.log('Uploads folder created');
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin login route
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const adminUser = { username: "sachin", password: "sachincse" };
    if (username === adminUser.username && password === adminUser.password) {
        req.session.admin = true;
        res.json({ success: true, message: "Admin login successful!" });
    } else {
        res.json({ success: false, message: "Invalid admin credentials" });
    }
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// Middleware to protect admin routes
app.use('/admin', (req, res, next) => {
    if (!req.session.admin) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }
    next();
});

app.post('/login', async (req, res) => {
    const { uname, upswd } = req.body;
    try {
        const user = await User.findOne({ username: uname });
        if (user && await bcrypt.compare(upswd, user.password)) {
            req.session.user = user;
            res.json({ success: true, message: 'Login successful!', user: { _id: user._id, username: user.username } });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

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

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.delete('/admin/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        fs.unlink(order.filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
