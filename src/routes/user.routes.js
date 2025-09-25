const express=require("express");
const router=express.Router();
const {registerUser, loginUser, logOutUser,refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}=require("../controllers/user.controller");
const upload=require("../middlewares/multer.middleware");
const verifyJWT=require("../middlewares/auth.middleware")



router.post("/register", 
  upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), 
  registerUser
);

router.post("/login",loginUser);

//secured routes

// Apply verifyJWT to everything below
// router.use(verifyJWT); else write the verifyjwt middleware in each route

router.post("/logout",verifyJWT,logOutUser);

router.post("/refresh-token",refreshAccessToken);

router.post("/change-password",verifyJWT,changePassword);

router.get("/current-user",verifyJWT,getCurrentUser);


// Account updates

router.patch("/update-account",verifyJWT,updateAccountDetails);

router.patch("/avatar",verifyJWT,upload.single("avatar"),updateUserAvatar);

router.patch("/cover-image",verifyJWT,upload.single("coverImage"),updateUserCoverImage);




// Profile & history

router.get("/c/:username",verifyJWT,getUserChannelProfile);

router.get("/history",verifyJWT,getWatchHistory);



module.exports = router;