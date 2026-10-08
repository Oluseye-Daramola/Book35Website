
const Service = require("../Models/Service");

const createService = async (req, res, next) => {
  
  try {
    
    const { name, description, durationMinutes, priceMinorUnits, currency } = req.body;

    const service = await Service.create({
      provider: req.user._id,
      name,
      description,
      durationMinutes,
      priceMinorUnits,
      currency,
    });

    res.status(201).json({
      success: true,
      data: { service },
    });

    
  } catch (err){
    
    next(err);
  }
  
};


const getServices = async (req, res, next) => {
  
  try {
    
    const services = await Service.find({ provider: req.user._id });

    res.status(200).json({
      success: true,
      data: { services },
    });
    
  } catch (err) {
    
    next(err);
  }
  
};



const updateService = async (req, res, next) => {
  
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this service",
      });
    }

    const { name, description, durationMinutes, priceMinorUnits, currency, isActive } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
    if (priceMinorUnits !== undefined) updates.priceMinorUnits = priceMinorUnits;
    if (currency !== undefined) updates.currency = currency;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedService = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: { service: updatedService },
    });
  } catch (err) {
    next(err);
    
  }
  
};







const deleteService = async (req, res, next) => {
  
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this service",
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
    
  } catch (err) {
    next(err);
    
  }
  
};




module.exports = { createService, getServices, updateService, deleteService };