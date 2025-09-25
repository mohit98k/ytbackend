    const { default: mongoose } = require("mongoose");
const User=require("../models/user.model");
    const uploadOnCloudinary =require("../utils/fileupload");
    const jwt = require("jsonwebtoken");

    //////////////////////////////register user///////////////////////////////////////

    const registerUser=async(req,res)=>{
        // get user details from frontend or using postman if no frontend available
        // validation - not null value check 
        // check if user already exists: using entered username or email or both
        // check for images, check for avatar
        // upload them to cloudinary, avatar
        // create user object - create entry in db
        // remove password and refresh token field from response
        // check for user creation
        // return res
 
        try{
           
            // 1. Get user details
            const {fullname,email,username,password}=req.body;
            

            // 2. Validation - not null
            if (!fullname || !email || !username || !password) {
                console.log("all fields are required");
                return res.status(400).json({ message: "All fields are required" });
            }

            // 3. Check if user already exists
            const existingUser = await User.findOne({
                $or:[{username}, {email}]
            })
            if(existingUser){
                console.log("the user already exists");
                return res.status(400).json({ message: "User already exists" });
            }

            // 4. Handle image uploads (if avatar is provided)

            const avatarLocalPath = req.files?.avatar?.[0]?.path; // path to avatar file
            const coverImageLocalPath = req.files?.coverImage?.[0]?.path;// path to coverImage file


        


            // Ensure avatar is mandatory
        if(!avatarLocalPath){
                console.log("avatar is required");
                return res.status(400).json({ message: "avatar file is required" });
        }
        // Upload avatar to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        // Only upload cover image if provided
            let coverImage;
            if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
            }

        if(!avatar){
            console.log("avatar upload failed");
            return res.status(400).json({message:"avatar upload failure"});
        }

        //5.create user object - create entry in db

            const newUser=await User.create({
                fullname,
                avatar:avatar.url,
                coverImage:coverImage?.url || "",//if its available take the url else take a empy str
                email,
                password,
                username:username.toLowerCase()
            })

            //6.lets check if its created or not and remove sensitive data like pass
            const createdUser=await User.findById(newUser._id).select(
                "-password -refreshToken"
            );

            //7.double check if its creatted
            if(!createdUser){
                console.log("something went worng while crating the user ");
                return res.status(400).json({message:"something went wrong while creating user"});
            }

            //8.return res
            res.status(201).json({
            message: "User created successfully",
            user: createdUser,
            });
            }
            catch(error){
                console.log(error.message);
            }
        };



    ///////////////////////////////////////log in user///////////////////////////////////

    const loginUser=async (req,res)=>{
                // req body -> take data 
                // username or email
                //find the user if exist or not 
                //password check
                //access and referesh token generate
                //send cookie
                try{
                    //1.get data from body 
                        const {username,email,password}=req.body;
                        //2.validation of provided data
                        if(!(username||email) || !password){
                            console.log("username / email and pass are required ");
                            return res.status(400).json({message:"usrename / email and password is required"});
                        }
                    //3.find user in db
                        const user=await User.findOne({
                            $or:[{username},{email}]
                        });
                        //if the user doesnt exist throw an error
                        if(!user){
                            console.log("user not found buddy");
                            res.status(400).json({message:"the user doesnt exist"});
                        }
                    //4.check the pass if its correct  , use the user you fetchd form db not the User instance
                        const isPasswordValid=await user.isPassCorrect(password);
                        if(!isPasswordValid){
                            console.log("the enterd passs is not correct ");
                            res.status(400).json({message:"the entered pass is incorrect"});
                        }
                    //5.accesss and refresh token generate 
                        const accessToken =await user.generateAcessToken();               
                        const refreshToken= await user.generateRefreshToken();

                    //6. we Save refresh token in DB 
                        user.refreshToken=refreshToken;
                        //save it but  in normal save call mongoose will try to revalidate all fields and run the pre("save") middleware 
                        //to avoid it we need to turn off validation 
                        await user.save({validateBeforeSave:false});
                    
                    //7.time to send access and ref token using cookie to user 

                    //option 1:fetcht the login user ////////// option 2:modify the current user obj , set the ref token fiels as its empty
                    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
                    //cookies can be modified from front end to make it only modifiable form server side we need options
                    const options={
                        httpOnly:true, //cookie not accessible via JS on frontend
                        secure:true    //cookie only sent over HTTPS (important in production)
                    }
                    return res
                    .status(200)
                    .cookie("accessToken",accessToken,options)
                    .cookie("refreshToken",refreshToken,options)
                    .json({//sends both token in json for frontend testing not mandatory but good practice
                        user:loggedInUser,accessToken,refreshToken
                    })    
                    

                }catch(error){
                    console.error("Error in loginUser:", error.message);
                    res.status(500).json({ message: "Server error", error: error.message });
                }
        };



    //////////////////////////////////log out user//////////////////////////////////////

    const logOutUser=async(req,res)=>{
                /*
            Find the logged-in user (middleware already attached req.user).

            Remove refreshToken from DB.

            Clear cookies (accessToken, refreshToken).

            Respond with success + user: null. 
            */
        try{
            //1.find the user 
            const userID=req.user._id;// added by verifyJWT middleware
           

            if (!userID) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // 2. Remove refreshToken from DB
           const u= await User.findByIdAndUpdate(
                userID,
                {
                   $unset: { refreshToken: 1 }
                }
            );
            // console.log("this user is getting logged out",u);

            //3.clear cookies
            const options={
                httpOnly:true,
                secure:true,
            }
            //4.send response
            return res.status(200)
                    .clearCookie("accessToken", options)
                    .clearCookie("refreshToken", options)
                    .json({
                         message: "User logged out successfully",
                         user: null,
                     });

        }catch(error){
                console.error("Error in loggingOut user:", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
    };


    //////////////////////////////////// refresh access token ///////////////////////////

    const refreshAccessToken=async(req,res)=>{
        /*
        Takes the refresh token from the client (usually in a cookie or request body).

        Verifies it’s valid and not expired.

        Generates a new access token if valid.

        Sends back the new access token to the client.

        */


        try{
            //1. Takes the refresh token from the client 
            const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
            if(!incomingRefreshToken){
                console.log("faild to fetch refreshtoken from cookie to refresh access token");
                return res.status(400).json({message:"faild to fetch refreshtoken from cookie to refresh access token"});
            }

            //2.decode the token using jwt verify
            const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

            //if you look the way we have generated the refresh token is by giving _id as payload so we can extract the _id from it 
            const id=decodedToken._id;

            //using this id lets fetch the user from db
            const user=await User.findById(id);

            if(!user){
                 console.log("invalid refresh token");
                return res.status(400).json({message:"invalid refresh token"});
            }

            //match both the token

            if(incomingRefreshToken !== user?.refreshToken){
                console.log("refresh token expired or used ");
                return res.status(400).json({message:"refresht token is expired or used"});
            }

            //generate new access token and send back

            const opitons={
                httpOnly:true,
                secure:true,
            }
            const accessToken= await user.generateAcessToken();
            const newrefreshToken= await user.generateRefreshToken(); 

            //save the new refresh token in db

            user.refreshToken=newrefreshToken;
            await user.save({validateBeforeSave:false});

            //send response and the tokens as cookies

            console.log("access token refreshed successfully ");
            return res
                    .status(200)
                    .cookie("accessToken",accessToken,options)
                    .cookie("refreshToken",newrefreshToken,options)
                    .json({accessToken,refreshToken:newrefreshToken});

        }catch(err){
            console.log("error in refreshing the refresh token ");
            res.status(400).json({message:"error in refreshing the refresh token"});
        }
    };



    //////////////////////////////////// change password ////////////////////////////////
    const changePassword =async(req,res)=>{
        try{

            const {oldPassword,newPassword}=req.body;
            //1.fetch the user ref from the req 
                //as user is logged in so the auth middleware must have attached the user to req
            const user=await User.findById(req.user?._id) //// added by verifyJWT middleware

             if(!user){
                console.log("error fetching user while changing pass");
               return  res.status(400).json({messagae:"error fetching the user while changing the password"});
            }
             
            //2.vrify the old password
            const correct=await user.isPassCorrect(oldPassword);

            if(!correct){
                console.log("the old pass enterd is incorrect");
               return  res.status(400).json({messagae:"the old pass entered is incorrect"});
            }

            //3.change the pass
            user.password=newPassword;
            await user.save({validateBeforeSave:false});

            //4.send response
            console.log("change password is successful");
            return res.status(200).json({message:"the pass has been changed successfully"});
        
        }catch(err){
            console.log("error while changing password");
            res.status(400).json({message:"error while changing the password",error});
        }
    };


    /////////////////////////////////// find current user /////////////////////////////
    const getCurrentUser=async (req ,res)=>{
        try{
            
            return res.status(200).json({
                success:true,
                message: "User fetched successfully",
                user: req.user,   // this is attached by verifyJWT middleware
            });

        }catch(er){
            console.log("error while finding the current user ");
            return res.status(400).json({message:"error while finding the current user "});
        }
    }



    //////////////////////////////////// update user info/////////////////////////////
    const updateAccountDetails=async(req,res)=>{
        try{
            //1.take the data that the usr wants to update
            const {fullname,email}=req.body;
               //validate the data
               if(!fullname && !email){
                console.log("fullname and email is required");
                return res.status(400).json({success:false,message:"fullname and email is required"});
               }

            //2.find the user and update the deail in one go 
            const user =await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set:{
                            fullname,
                            email:email,//both the syntax works
                    }
                },
                {new:true}//returns the new updated user 
            ).select("-password");

            //3.return the response
            return res.status(200).json({
                success:true,
                message:"the information of email and fullname has been updated",
                 user:user,
            })



        }catch(err){
            console.log("error while updating account details ");
            return res.status(500).json({
                success:false,
                message:"error while updatin the user details",
            })
        }
    };

    const updateUserAvatar=async(req,res)=>{
        try{

            //1.get the file path form multer file.path

            const avatarLocalPath=req.file?.path;
            if(!avatarLocalPath){
                console.log("avatar file is missing");
                return res.status(400).json({message:"avatar file is missing "});
            }

            //2.upload to cloudinary and store the url
            const avatar=await uploadOnCloudinary(avatarLocalPath);

            if(!avatar.url){
                console.log("error while uploading avatar to cloudinary");
               return  res.status(400).json({message:"error while uploading avatar to cloudinary"});
            }

            //3.update to the db
           const user= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url,
                }
            },
            {new:true},
           ).select("-password");

            if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
            }

           //4.send response

           return res.status(200).json({
            success:true,
            message:"updated avatar successfully",
            user:user,
           })

        }catch(err){
            console.log("failed to update user avatar",err);
           return  res.status(500).json({
                success:false,
                messagae:"failed to update user avataar",
                error: err.message,
            })
        }
    };

     const updateUserCoverImage=async(req,res)=>{
        try{

            //1.get the file path form multer file.path

            const coverImageLocalPath=req.file?.path;
            if(!coverImageLocalPath){
                console.log("cover image file is missing");
                return res.status(400).json({message:"cover image file is missing "});
            }

            //2.upload to cloudinary and store the url
            const coverImage=await uploadOnCloudinary(coverImageLocalPath);

            if(!coverImage.url){
                console.log("error while uploading coverImage to cloudinary");
               return  res.status(400).json({message:"error while uploading coverImage to cloudinary"});
            }

            //3.update to the db
           const user= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url,
                }
            },
            {new:true},
           ).select("-password");

            if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
            }

           //4.send response

           return res.status(200).json({
            success:true,
            message:"updated cover image successfully",
            user:user,
           })

        }catch(err){
            console.log("failed to update user cove image",err);
           return  res.status(500).json({
                success:false,
                messagae:"failed to update user coverImage",
                error: err.message,
            })
        }
    };



    //////////////////////////////////// get user profie for user dashboard ///////////////////////////
    const getUserChannelProfile = async (req,res)=>{

        //we have to join the subscription model with the user model to get the user channerl profile
        //cause we need to show the followers and following count 
        try{

            //1.fetch the user from params req.params = data passed in the URL path.
            //can also be done using req.user (as we've configure jwq verify)

            const {username}=req.params;
            if(!username){
                console.log("error in finding username in get channel profile");
                return res.status(400).json({message:"errror in fetching user for user profile"});
            }

            //2 user aggregation pipeline
           const channel= await User.aggregate([
                {
                    $match:{
                        username:username, // find those files wherer our current user is
                    }
                },
                {
                //followers → how many people subscribed to this user (channel = userId)
                //lookin up all the file where the channel is this user
                    $lookup:{
                        from:"subscriptions",  // collection to join
                        localField:"_id",      // field from current collection (User) 
                        foreignField:"channel",// field from other collection (Subscription)
                        as:"subscribers", // name of the array where the joined data will be stored
                    }
                },
                {
                    //this pipeline stage is for following count 
                    //Following count → how many channels this user subscribed to (subscriber = userId)
                    //looking up all the files where the subscriber is this user
                    $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"subscriber",
                        as:"subscribedTo",
                    }
                },
                {
                    $addFields:{
                        //Take the current document and attach some extra values to it.
                        subscribersCount:{
                            $size:"$subscribers",//$subscribers →  refers to the subscribers array inside this document.
                        },
                        channelsSubscribedToCount:{
                            $size:"$subscribedTo",
                        },
                        isSubscribed:{
                            $cond:{
                                if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                                then: true,
                                else: false,
                            }
                        }
                    }
                },
                {
                    $project:{
                        //$project lets you control what fields appear in the output of your aggregation.
                        fullname:1,
                        username:1,
                        subscribersCount:1,
                        channelsSubscribedToCount:1,
                        isSubscribed:1,
                        avatar:1,
                        coverImage:1,
                        email:1,
                    }
                },

            ]);

            //3.return the response you've created 

            if(!channel.length){
                console.log("channel does not exist");
                return res.status(400).json({message:"the channel does not exist"});
            }
            return res.status(200).json({
                succsess:true,
                message:"got the channel",
                channel:channel,
            })

        }catch(err){
            console.log("failed to get user channel profile ", err);
            return res.status(500).json({
                success:false,
                message:"failed to get user channel profile ",
            })
        }
    };



    ////////////////////////////////// watch history ///////////////////////////////////////////////
    const getWatchHistory=async(req,res)=>{

        //Match the user
        //lookup the watch history field in user with videos
        //lookup the owner field of video with user and take only necessay user info
        //Flatten the owner array
        //Project final output
        //Send response

       
        try{

            const user=await User.aggregate([

            //1.match the user 
                {
                    $match:{
                        _id:new mongoose.Types.ObjectId(req.user._id),
                        
                        //cant directly match with req.user_id 
                        // cause inside pipeling we need to maually pardse the string to object id
                    }
                },


            //2.join it with the videos an inside it join video to user and format the array
                {
                    $lookup:{
                        // join user.watchHistory -> videos
                        //joining the watchhistory arrayfield in user to videos model
                        from:"videos",
                        localField:"watchHistory",
                        foreignField:"_id",
                        as:"watchHistory",

                        pipeline:[
                            //but in videos model we need owner so need to rejoin the video to user model
                            // join each video.owner -> users
                            {
                                $lookup:{
                                    from:"users",
                                    localField:"owner",
                                    foreignField:"_id",
                                    as:"owner",
                                    pipeline:[//but we dont need all the user info so just project the necssarys in owner field of video model
                                        {
                                            $project:{
                                                fullname:1,
                                                username:1,
                                                avatar:1,
                                            }
                                        },
                                    ]
                                }
                            },
                            {   $addFields:{
                                    //now we have populated the watch history with video and owner info but the owner array needs some structuring
                                    owner:{
                                            $first:"$owner",
                                    }
                                },
                            },
                        ]
                    },

                },

                //3.project the fields for the final structured doc

                {

                    $project:{
                        watchHistory: 1
                    },

                },
               
            ]);

            //now time to return res
            return res.status(200).json({
                success:true,
                message:"fetched the watch history successfully",
                watchHistory:user[0].watchHistory,
            });

        }catch(err){
            console.log("failed to fetch watch history ");
            return res.status(500).json({
                success:false,
                message:"failed to fetch the watch history",
            })
        }
    };


    


    //////////////////////////////////////Export/////////////////////////////////////////

    module.exports={registerUser,loginUser,logOutUser,refreshAccessToken,changePassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory}; 