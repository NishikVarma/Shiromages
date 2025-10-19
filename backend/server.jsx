const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require('./config/db.jsx'); 

connectDB();

const imageRoutes = require("./routes/imageRoutes.jsx");
const userRoutes = require("./routes/userRoutes.jsx");

const app = express();

app.use((req, res, next) => {
    console.log(`--- DEBUG: Received ${req.method} request for: ${req.url} ---`);
    next();
});

const corsOptions = {
    origin: "*", 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
    allowedHeaders: ["Content-Type", "Authorization"], 
};

app.use(cors(corsOptions));
// app.use(express.json());

app.use("/api/images", imageRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));