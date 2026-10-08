

//handles Registration / SignUps

const validateRegister = (req, res, next) => {
  const errors = [];

  // The checks
  const { name, businessName, email, password, phone, bio } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0){
    errors.push("Name is required");
  }
  
  if (!businessName || typeof businessName !== "string" || businessName.trim().length === 0){
    errors.push("Business name is required");
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    errors.push("A valid email is required");
  }
  
  if (!password || password.length < 8){
    errors.push("Password must be at least 8 characters");
  }
  

  if (errors.length > 0){
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};



//handles Login Case

const validateLogin = (req, res, next)=>{
    const errors = [];
    const { email, password } = req.body;
  
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      errors.push("A valid email is required");
    }

    if (!password) {
      errors.push("Password is required");
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

  next();
  
};


module.exports = { validateRegister, validateLogin };

