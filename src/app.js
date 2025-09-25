const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors =require('cors');

app.use(cors({
    origin:"http://localhost:5173" // your React frontend
}));

app.use(express.json()); // to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // to parse form-data if needed
app.use(cookieParser());

//import routes
const userRoutes=require("./routes/user.routes");
app.use("/api/v1/user",userRoutes);




module.exports = app;
