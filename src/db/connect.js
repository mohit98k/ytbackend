const mongoose =require("mongoose");
const{MONGO_URI} =require("../constants")

const connectDB=async()=>{
    try{
        await mongoose.connect(MONGO_URI);
        console.log("the connection between db and server has been established")

    }catch(error){
        console.error("failes to connect with db",error.message);
    }
}
module.exports=connectDB;