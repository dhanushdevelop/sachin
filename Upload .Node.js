const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://your-username:your-password@your-cluster.mongodb.net/uploadDB?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schema for storing file metadata
const fileSchema = new mongoose.Schema({
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
const Order = mongoose.model('Order', fileSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        const { name, address, phone, altPhone, paymentMethod, numPages, numCopies } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
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

        res.json({ success: true, message: 'File uploaded successfully', filePath: req.file.path });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
