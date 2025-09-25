const mongoose=require("mongoose");


const videoSchema=new Schema({
     
    videoFile:{
        type:String,//link from cloud
        required:true,
    },
    thumbnail:{
        type:String,//link from cloud
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,//will be provided by the cloud where the video is stored
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },



},{timestamps:true});



module.exports=mongoose.model("Video",videoSchema);