const express = require("express");
const router = express.Router();

const { register, login } = require("../Controllers/authController");
const { validateRegister, validateLogin } = require("../Validations/authValidation");
const { authLimiter, registrationLimiter } = require("../Middleware/rateLimiter");

router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth route is working" });
});

router.post("/register", registrationLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);

module.exports = router;