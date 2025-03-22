require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    uname: { type: String, required: true, unique: true },
    upswd: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

app.post("/register", async (req, res) => {
    try {
        const { uname, upswd } = req.body;
        const hashedPassword = await bcrypt.hash(upswd, 10);
        const newUser = new User({ uname, upswd: hashedPassword });
        await newUser.save();
        res.json({ success: true, message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error registering user" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { uname, upswd } = req.body;
        const user = await User.findOne({ uname });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });
        
        const isMatch = await bcrypt.compare(upswd, user.upswd);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ success: true, message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/profile", async (req, res) => {
    try {
        const token = req.headers["authorization"];
        if (!token) return res.status(401).json({ success: false, message: "Access Denied" });
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select("-upswd");
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: "Invalid Token" });
    }
});

// Serve index.html for any unknown routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
