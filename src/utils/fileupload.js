const cloudinary = require('cloudinary').v2;
const fs = require("fs");
//goal is to take file from the local server and upload it to cloudinary and then delete/unlink it form the local server

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary =async (localFilePath)=>{
    try{
        if(!localFilePath)return null;//if the file doesnt exist directly return
        //else upload the file and store the url in response
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //now the file has been uploaded
        console.log("file upload to cloudinary done and here is the link",response.url);

        // Delete from local server
        fs.unlinkSync(localFilePath);

        
        return response;//send the whole response , anything can be extracted from it

    }catch(error){
        //file couldnt be uploaded so delete it frm the local storage 
        fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload error:", error);
        return null;
    }
}

module.exports=uploadOnCloudinary;