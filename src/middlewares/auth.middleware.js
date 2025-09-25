const jwt = require("jsonwebtoken");
const User=require("../models/user.model");

const verifyJWT = async (req, res, next) => {
  try {

    //first extract the token from the cookies or req header 
    //header format :- Authorization: Bearer <token> so used replace to extract the token part only 
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
    //if theres no token 
    if(!token){

        return res.status(401).json({message:"null token cant do jwt authetication "});
    }
    //if the token is availabel then verify the token and decode it using its secret key
    //in this access token we have id email username etc look in the usermodel ther is the function to generate the access token 
    const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //now fetch the user from db
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user){
        return res.status(401).json({message:"invalid access token for this user"});
    }

    //Attach user to request
    req.user = user;

    next(); // move to next middleware/controller

  } catch (err) {
    console.log("error in jwt authentication middleware");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

module.exports = verifyJWT;
