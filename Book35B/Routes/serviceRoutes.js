const express = require("express");

const router = express.Router();

const { createService, getServices, updateService, deleteService } = require("../Controllers/serviceController");

const { validateCreateService, validateUpdateService } = require("../Validations/serviceValidation");

const { authenticate } = require("../Middleware/auth");



router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Service route is working"
    });
});



router.post("/", authenticate, validateCreateService, createService);

router.get("/", authenticate, getServices);

router.put("/:id", authenticate, validateUpdateService, updateService);

router.delete("/:id", authenticate, deleteService);

module.exports = router;