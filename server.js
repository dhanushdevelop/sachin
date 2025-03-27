const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // Serve frontend

// MongoDB Connection
const MONGO_URI = "mongodb+srv://dhanushua11:damUvSoBAPYPgeuW@cluster0.3ynp0.mongodb.net/userDB?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Cloudinary Configuration
cloudinary.config({
    cloud_name: "dbx6b3wwl",
    api_key: "584611393161385",
    api_secret: "te_ZPfkOobATrb6LIWNj3j4pObY"
});

// User Schema & Model
const userSchema = new mongoose.Schema({
    uname: String,
    upswd: String
});
const User = mongoose.model("User", userSchema);

const JWT_SECRET = "your_secret_key";

// Order Schema & Model
const orderSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    altPhone: String,
    paymentMethod: String,
    numPages: Number,
    numCopies: Number,
    printType: String,
    totalPrice: Number,
    pdfUrl: String,  // Changed from pdfPath to pdfUrl for Cloudinary
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// Configure Multer for Memory Storage (for Cloudinary Upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Order with Cloudinary
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
    try {
        const { name, address, phone, altPhone, paymentMethod, numPages, numCopies, printType } = req.body;
        if (!req.file) return res.status(400).json({ success: false, message: "PDF file is required!" });

        let pricePerPage = printType === "double" ? 1 : 1.5;
        const totalPrice = numPages * numCopies * pricePerPage;

        // Upload PDF to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "pdf_uploads" }, 
            async (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary Upload Error:", error);
                    return res.status(500).json({ success: false, message: "Cloudinary upload failed!" });
                }

                const newOrder = new Order({
                    name, address, phone, altPhone, paymentMethod, printType,
                    numPages: parseInt(numPages), numCopies: parseInt(numCopies),
                    totalPrice, pdfUrl: result.secure_url  // Store Cloudinary URL
                });

                await newOrder.save();
                res.json({
                    success: true,
                    message: "Order submitted successfully!",
                    orderDetails: {
                        name, address, phone, numPages, numCopies, totalPrice, printType, fileUrl: newOrder.pdfUrl
                    }
                });
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ===================== USER REGISTER & LOGIN ROUTES =====================
app.post("/register", async (req, res) => {
    const { uname, upswd } = req.body;

    if (!uname || !upswd) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    try {
        const existingUser = await User.findOne({ uname });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const newUser = new User({ uname, upswd });
        await newUser.save();
        res.json({ success: true, message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    const { uname, upswd } = req.body;

    if (!uname || !upswd) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    try {
        const user = await User.findOne({ uname });
        if (!user || user.upswd !== upswd) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ uname: user.uname }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ success: true, token });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ===================== ADMIN ROUTES =====================

const ADMIN_USERNAME = "sachin";
const ADMIN_PASSWORD = "sachin123";
const ADMIN_SECRET = "admin_secret_key";

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "admin" }, ADMIN_SECRET, { expiresIn: "1h" });
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ success: false, message: "Unauthorized" });

    jwt.verify(token, ADMIN_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid token" });
        next();
    });
};

app.get("/admin/orders", verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find();
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
});

app.delete("/admin/orders/:id", verifyAdmin, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete order" });
    }
});

// ===================== SERVER START =====================
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
