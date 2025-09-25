// import mongoose from "mongoose"; es module way of importing 
const mongoose = require("mongoose");

const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");

const userSchema=new mongoose.Schema({

    username:{
        type:String,
        required:[true,"username is reqired"],
        lowercase:true,
        unique:true,
        trim:true,
        index:true,//to make a field searchabel

    },
    email:{
        type:String,
        required:[true,"email is reqired"],
        lowercase:true,
        unique:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:[true,"fullname is reqired"],
        trim:true,
        index:true,
    },
    avatar:{
        type:String,//coluinary url
        required:true,
    },
    coverImage: {
            type: String, // cloudinary url
        },
    watchHistory:[
            { 
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video",
            }
        ],

    password:{
        type:String,
        required:true,
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})




//now use a pre middle ware to encrypt the password just before writting into the db

//but cant hash the password every time the user saves something on his profile 
//we want only when the user changes it so introduce a if block 


userSchema.pre("save", async function (next){

    if(this.isModified("password")){//if the password field has been modified only then ...
        this.password=await bcrypt.hash(this.password,10);
        next();
    }

    else return next();
    
})


//now write a method that check the entered pass if its correct or not

userSchema.methods.isPassCorrect= async function (enterdpass){
    return await bcrypt.compare(enterdpass,this.password);
}


userSchema.methods.generateAcessToken=async function(){
   return  await jwt.sign(
        {//payload
            _id:this._id,
            email:this.email,
            username:this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken=async function(){
     return  await jwt.sign(
        {//payload
            _id:this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



//export default mongoose.model("User",userSchema); default export 
//export const User=mongoose.model("User",userSchema); named export

module.exports = mongoose.model("User", userSchema);