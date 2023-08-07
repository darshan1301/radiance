import mongoose from "mongoose";

// Define the admin access schema
const adminAccessSchema = new mongoose.Schema({
  adminCode: {
    type: String,
    required: [true, 'Admin code is required'],
    default: "no code"
  }

});

// Define the regular user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  read: {
    type: Boolean,
    default: true,
    required: [true, 'Read access is required'],
  },
  create: {
    type: Boolean,
    default: false,
    required: [true, 'Create access is required'],
  },
  delete: {
    type: Boolean,
    default: false,
    required: [true, 'Delete access is required'],
  },
  adminAccess: {
    type: Boolean,
    default: false,
  },
  admin: adminAccessSchema,
});

// Define the user model for regular users
export const User = mongoose.model('User', userSchema);

// Define the admin model for admin users
export const Admin = User.discriminator('Admin', adminAccessSchema);