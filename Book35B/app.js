const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const authRoutes = require("./Routes/authRoutes");
const providerRoutes = require("./Routes/providerRoutes");
const serviceRoutes = require("./Routes/serviceRoutes");
const availabilityRoutes = require("./Routes/availabilityRoutes");
const appointmentRoutes = require("./Routes/appointmentRoutes");
const publicRoutes = require("./Routes/publicRoutes");
const errorHandler = require("./Middleware/errorHandler");



app.use(helmet());
app.use(cors({ origin: "https://book35website-1.onrender.com" }));
// 2mb so a 1 MB profile photo still fits once base64-encoded (~1.37 MB)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(morgan("combined"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Appointment Booking API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/public", publicRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

module.exports = app;
