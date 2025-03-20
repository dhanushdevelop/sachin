const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;


mongoose.connect('mongodb+srv://dhanushua11:damUvSoBAPYPgeuW@cluster0.3ynp0.mongodb.net/userDB?retryWrites=true&w=majority')
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


const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


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


app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        console.log('Received upload request');
        console.log('Request body:', req.body);
        console.log('Uploaded file:', req.file);

        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { name, address, phone, altPhone, paymentMethod, numPages, numCopies } = req.body;

        const newOrder = new Order({
            name,
            address,
            phone,
            altPhone,
            paymentMethod,
            filePath: req.file.path,
            numPages,
            numCopies
        });

        await newOrder.save();
        console.log('File uploaded successfully:', req.file.path);

        res.json({ success: true, message: 'File uploaded successfully', filePath: req.file.path });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});



app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
