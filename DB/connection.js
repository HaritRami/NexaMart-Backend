// import dotenv from 'dotenv';
// const mongoose = require("mongoose");

// const DB = process.env.URL; // Ensure the MongoDB URL is set in your .env file

// if (!DB) {
//   console.error("MongoDB URL is not defined!!!");
//   process.exit(1); // Exit process if DB URL is not provided
// }

// mongoose.connect(DB)
//   .then(() => {
//     console.log("Connected to MongoDB...");
//   })
//   .catch((error) => {
//     console.error("MongoDB connection error:", error);
//     process.exit(1); // Exit process if DB connection fails
//   });

// import dotenv from 'dotenv';
// const mongoose = require('mongoose')
// dotenv.config();
// const mongoURI = process.env.MONGO_URI;

// mongoose.connect(mongoURI)
// mongoose.connection.on('connected',()=>{
//     console.log("connected to mongoDB")
// })

// mongoose.connection.on('error',(err)=>{
//     console.log("error :"+err)
// })

// module.exports = mongoose



import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()
if(!process.env.MONGO_URI){
    throw new Error(
        "Please provide env detail anf MONGODB connections"
    )
}

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected ...................!!!!!!!!!!!");
    }
    catch(err){
        console.log("connection error ",err);
        process.exit(1);
    }
}
export default connectDB;