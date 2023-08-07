import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  filepath: {
    type: String,
    required: [true, 'Filepath is required'],
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
  },
  caption: {
    type: String,
    validate: {
      validator: function (value) {
        return value.length <= 100; // Assuming the caption should be less than or equal to 100 characters
      },
      message: 'Caption must be less than or equal to 100 characters',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Post = mongoose.model('Post', postSchema);