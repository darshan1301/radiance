import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import fs from 'fs';


function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const interval in intervals) {
    const value = Math.floor(seconds / intervals[interval]);
    if (value >= 1) {
      return value + " " + interval + (value === 1 ? "" : "s") + " ago";
    }
  }

  return "just now";
}

// GET POST

export const getPosts = async (req, res) => {
  try {
    // console.log("home route has been hit.")
    const posts = await Post.find({}); 

    const formattedPosts = posts.map((post) => ({
      ...post._doc,
      timestamp: timeSince(post.createdAt), 
    }));
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}

//ADD POST
export const uploadPost = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user.create) {
      return res.status(403).json({message:"You are not allowed to post images."});
    }

    if (req.file) {
      //console.log("File uploaded:", req.file);
      const newPost = new Post({
        filename: req.file.filename,
        filepath: req.file.path,
        caption: req.body.caption,
      });

      await newPost.save();
      console.log("Post saved to the database:", newPost);
      res.status(201).json({ post: newPost });
    } else {
      console.log("No file uploaded");
      return res.status(400).json({ message: 'Image not posted. No file uploaded.' }); 
    }
  } catch (error) {
    console.error("Error saving post to the database:", error);
  }
}

// DELETE POST

export const deletePost = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      console.log("Post not found.");
      return res.status(404).send("Post not found.");
    }

    const user = await User.findById(userId);
    if (!user.delete) {
      console.log("User does not have delete access.");
      return res.status(403).send({message:"You are not allowed to delete this post."});
    }

    fs.unlinkSync(post.filepath); 

    await Post.findByIdAndRemove(postId);
    res.sendStatus(204);
    console.log("one post deleted.");
  } catch (error) {
    console.error("Error deleting post:", error);
    
  }
}