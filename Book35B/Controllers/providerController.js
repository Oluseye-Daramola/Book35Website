

const Provider = require("../Models/Provider");



//Captures displays users profile
const getMe = async (req, res, next) =>{
  
  try {
    const provider = await Provider.findById(req.user._id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }
    
    res.status(200).json({
      
      success: true,
      
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          businessName: provider.businessName,
          slug: provider.slug,
          email: provider.email,
          phone: provider.phone,
          location: provider.location,
          services: provider.services,
          slogan: provider.slogan,
          avatar: provider.avatar,
          bio: provider.bio,
        },
        
      },
      
    });
    
  } catch (err) {
    next(err);
  }
  
};




//Possible User Profile edits
const updateMe = async (req, res, next) => {
  try {
    const { name, businessName, location, services, slogan, avatar, bio, phone } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (businessName !== undefined) updates.businessName = businessName;
    if (location !== undefined) updates.location = location;
    if (services !== undefined) updates.services = services;
    if (slogan !== undefined) updates.slogan = slogan;
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        provider: {
          id: updatedProvider._id,
          name: updatedProvider.name,
          businessName: updatedProvider.businessName,
          slug: updatedProvider.slug,
          email: updatedProvider.email,
          phone: updatedProvider.phone,
          location: updatedProvider.location,
          services: updatedProvider.services,
          slogan: updatedProvider.slogan,
          avatar: updatedProvider.avatar,
          bio: updatedProvider.bio,
        },
      },
    });
    
  } catch (err) {
    next(err);
  }
  
};


module.exports ={ getMe, updateMe };