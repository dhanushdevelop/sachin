const jwt = require("jsonwebtoken");

const JWT_SECRET = "your-actual-secret-key"; // Use a strong secret key

const payload = {
    id: "user123",
    name: "John Doe",
    role: "admin"
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

console.log("✅ New JWT Token:", token);
