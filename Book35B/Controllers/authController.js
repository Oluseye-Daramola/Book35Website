

const jwt = require("jsonwebtoken");

const Provider = require("../Models/Provider");

const { jwtSecret, jwtExpiresIn } = require("../Config/env");

const bcrypt = require("bcryptjs");

const { sendWelcomeEmail } = require("../Services/emailService");



const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove anything that's not a letter, number, space, or hyphen
    .replace(/\s+/g, "-")           // replace spaces with hyphens
    .replace(/-+/g, "-");           // collapse multiple hyphens into one
};


//handles SignUp
const register = async (req, res, next) =>{
  
  try {
    
    const { name, businessName, email, password, phone, bio } = req.body;

    const existing = await Provider.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A provider with this email already exists",
      });
    }
  
  
    let slug = generateSlug(businessName);

    
    // prevents 2 providers from having thesame business name 
    
    // to be updated later to reject rather than a count 
    let slugExists = await Provider.findOne({ slug });
    let counter = 1;

    
    while (slugExists) {
      const newSlug = `${slug}-${counter}`;
      slugExists = await Provider.findOne({ slug: newSlug });
      
      if (!slugExists) {
        slug = newSlug;
      }
      
      counter++;
      
    }


    const provider = await Provider.create({
          name,
          businessName,
          slug,
          email,
          password,
          phone,
          bio,
    });

    // Fire-and-forget: the account already exists, so a slow or failed email
    // must not delay or fail the signup response
    sendWelcomeEmail({
      toEmail: provider.email,
      name: provider.name,
      businessName: provider.businessName,
    }).catch((emailErr) => {
      console.error("Welcome email failed:", emailErr.message);
    });


    const token = jwt.sign(
      {id: provider._id },
      jwtSecret,
      {expiresIn: jwtExpiresIn,}
    );



    res.status(201).json({
      success: true,
      
      data:{
        
        provider:{
          id: provider._id,
          name: provider.name,
          businessName: provider.businessName,
          slug: provider.slug,
          email: provider.email,
        },
        
       token
       },
    });
    
  }catch(err){
    
    next(err);
    
  }
  
};




//handle Login / Signin
const login = async (req, res, next) =>{
  
  try {
    const { email, password } = req.body;

    const provider = await Provider.findOne({ email }).select("+password");

    if (!provider) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, provider.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!provider.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    const token = jwt.sign({ id: provider._id }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    res.status(200).json({
      success: true,
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          businessName: provider.businessName,
          slug: provider.slug,
          email: provider.email,
        },
        token
      },
      
    });
    
  } catch (err) {
    next(err);
  }
  
};





module.exports = { register, login };