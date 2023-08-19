import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "dotenv";

config();

//USER REGISTRATION
export const register = async (req, res) => {
  const { name, email, password, admin, adminCode } = req.body;

  try {
    const isAdmin = admin === "true" && adminCode === process.env.ADMIN_CODE;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send("User with this email already exists" );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      adminAccess: isAdmin,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, isAdmin: isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token);
    res.status(200).json({ token: token });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).send("Error during user registration");
  }
}

//USER LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log( user + " not found");
      return res
        .status(404)
        .send(user + "User not found. Please check your email and try again.");
        
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({message: "Invalid password. Please try again."});
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.adminAccess },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token);
    res.status(200).json({ token: token, userId:user._id });
  } catch (error) {
    console.error("Error during user login:", error);
    
  }
}

//ADMIN-PANEL ACCESS
export const adminPanelAccess = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user || !user.adminAccess) {
      return res.status(405).json({ message: "User doesn't have adminAccess." });
    }
    //console.log("adminPanel has been hit.");
    const users = await User.find({});
    res.json({ users });
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

//UPDATE USER PERMISSIONS
export const updateAccess = async (req, res) => {
  const userUpdates = req.body;

  try {
    const bulkWriteOperations = userUpdates.map((update) => ({
      updateOne: {
        filter: { _id: update._id }, 
        update: { $set: update }, 
      },
    }));

    const result = await User.bulkWrite(bulkWriteOperations);
    console.log("User Access Updated", result);
    res.status(200).json({ message: "Update successful", result});
  } catch (error) {
    console.error("Error updating user access:", error);
    
  }
}