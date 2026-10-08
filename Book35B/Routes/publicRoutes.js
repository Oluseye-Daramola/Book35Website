const express = require("express");

const router = express.Router();

const { getPublicProviderProfile, getPublicProviderServices, getPublicProviderSlots, createAppointment } = require("../Controllers/publicController");
const { validate } = require("../Middleware/validate");
const { createAppointmentSchema } = require("../Validations/appointmentValidation");
const { bookingLimiter } = require("../Middleware/rateLimiter");


router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Public route is working"
    });
});

router.get("/providers/:slug", getPublicProviderProfile);

router.get("/providers/:slug/services", getPublicProviderServices);

router.get("/providers/:slug/slots", getPublicProviderSlots);

router.post("/appointments", bookingLimiter, validate(createAppointmentSchema), createAppointment);

module.exports = router;