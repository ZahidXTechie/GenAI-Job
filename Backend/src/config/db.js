const mongoose = require("mongoose");
require("dotenv").config();
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected successfully")
    }catch(err){
        console.log("MongoDB connection failed", err)
        throw err;
    }

}

module.exports = connectDB;