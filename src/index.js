require('dotenv').config();//ensures the environment variables are ready and loaded before anything else runs.
const connectDB=require("./db/connect");
const app=require("./app")
const {PORT}=require("../src/constants")

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("app is active buddy");
    })
})
.catch((err)=>{
    console.log("connection failed buddy",err);
})