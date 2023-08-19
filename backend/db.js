import mongoose from "mongoose";

async function connectMongoDB () {
  try{
    await mongoose.connect("mongodb://127.0.0.1:27017/demoappDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to mongoDB.")
  } catch (err){
    console.error("Database connection error:", err);
  }
 
}

export {connectMongoDB};