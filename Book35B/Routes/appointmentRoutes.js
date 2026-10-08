const express = require("express");

const router = express.Router();

const { authenticate } = require("../Middleware/auth");

const { getAppointments, getAppointmentById, cancelAppointment, confirmAppointment, completeAppointment } = require("../Controllers/appointmentController")


router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Appointment route is working"
    });
});



// Temporary for Login texting (to be removed later)

// router.get("/test-protected", authenticate, (req, res) => {
  
//   res.json({
    
//     success: true,
//     message: "You are authenticated",
//     provider: {
//       id: req.provider._id,
//       name: req.provider.name,
//       email: req.provider.email
//     }
    
//   });
  
// });


router.get("/",authenticate,getAppointments);

router.get("/:id", authenticate, getAppointmentById);

router.patch("/:id/cancel", authenticate, cancelAppointment);

router.patch("/:id/confirm", authenticate, confirmAppointment);

router.patch("/:id/complete", authenticate, completeAppointment);











module.exports = router;