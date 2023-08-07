import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fs from 'fs';
import { config } from "dotenv";
config();
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { User, Admin } from "./models/User.js";
import { Post } from "./models/Post.js";
import { authenticateToken } from "./middlewares/Authenticate.js";
import { log } from "console";

const port = process.env.PORT;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());


app.use(
  "/userUploadedFiles",
  express.static(path.join(__dirname, "userUploadedFiles"))
);

mongoose.connect("mongodb://127.0.0.1:27017/demoappDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./userUploadedFiles");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null, file.fieldname + "-" + Date.now() + "." + ext);
  },
});

const upload = multer({ storage: storage });

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


app.get("/login", (req, res) => {
  // You can send a simple message or an object as the response.
  res.send("login page");
});


app.get("/register", (req, res) => {
  res.redirect("register");
});

app.get("/", (req, res) => {
  res.redirect("welcome");
});

app.get("/logout", (req, res) => {
  res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });

  res.redirect("/");
});

app.get("/home" , authenticateToken, async (req, res) => {
  try {
    console.log("home route has been hit.")
    const posts = await Post.find({}); 

    const formattedPosts = posts.map((post) => ({
      ...post._doc,
      timestamp: timeSince(post.createdAt), 
    }));
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
});

// Route handler for the admin panel page
app.get("/adminPanel" , authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user || !user.adminAccess) {
      return res.status(405).json({ message: "User doesn't have adminAccess." });
    }
    console.log("adminPanel has been hit.");
    const users = await User.find({});
    res.json({ users });
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
});

/////post routes goes here
app.post("/register", async (req, res) => {
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
});

// Route to handle user login
app.post("/login", async (req, res) => {
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
});

app.post("/upload",  authenticateToken, upload.single("imageFile"), async (req, res) => {
    const userId = req.user.userId;

    try {
      const user = await User.findById(userId);

      if (!user.create) {
        return res.status(403).json({message:"You are not allowed to post images."});
      }

      if (req.file) {
        console.log("File uploaded:", req.file);
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
);

// Route to handle post deletion
app.post("/delete/:postId",  authenticateToken, async (req, res) => {
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
});


app.post("/updateAccess",  authenticateToken, async (req, res) => {
  const userUpdates = req.body;

  try {
    const bulkWriteOperations = userUpdates.map((update) => ({
      updateOne: {
        filter: { _id: update._id }, // Use the appropriate identifier for your users
        update: { $set: update }, // Update the entire user object with new data
      },
    }));

    const result = await User.bulkWrite(bulkWriteOperations);
    console.log("User Access Updated", result);
    res.status(200).json({ message: "Update successful", result});
  } catch (error) {
    console.error("Error updating user access:", error);
    
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
