const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const port = 3000; // Replace with your desired port number

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.set('view engine', 'ejs');

// Middleware to serve static files from the "public" folder
app.use(express.static('public'));

app.use('/userUploadedFiles', express.static(path.join(__dirname, 'userUploadedFiles')));

mongoose.connect('mongodb://127.0.0.1:27017/demoappDB');


// Define the admin access schema
const adminAccessSchema = new mongoose.Schema({
  adminCode: {
    type: String,
    required: [true, 'Admin code is required'],
    default: "no code"
  }
  // Add any other admin-specific properties here
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
  // Nested admin schema
  admin: adminAccessSchema,
});

// Define the user model for regular users
const User = mongoose.model('User', userSchema);

// Define the admin model for admin users
const Admin = User.discriminator('Admin', adminAccessSchema);

const postSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: [true, 'User is required'],
  // },
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
        // Custom validation logic for the caption
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

const Post = mongoose.model('Post', postSchema);

// module.exports = { User, Admin, Post };


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './userUploadedFiles')
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null,file.fieldname + '-' + Date.now()+ "." + ext)
  }
})

const upload = multer({ storage: storage })
// Set EJS as the view engine

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


// Middleware to check JWT authentication

const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    // If the token is not present, redirect the user to the login page
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      // If the token is invalid, redirect the user to the login page
      return res.redirect('/login');
    }

    // If the token is valid, store the user information in the request object for further use
    req.user = {
      userId: decodedToken.userId,
      isAdmin: decodedToken.isAdmin,
      create: decodedToken.create,
      delete: decodedToken.delete,
      post: decodedToken.post,
      adminAccess: decodedToken.adminAccess
    };
    next();
  });
};



app.get('/home', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({}); // Fetch all posts

    // Format the "createdAt" timestamps to "time ago" format
    const formattedPosts = posts.map(post => ({
      ...post._doc,
      timestamp: timeSince(post.createdAt), // Add the formatted timestamp as a new property
    }));

    // Pass the formatted posts data to the EJS template for rendering
    res.render('home', { posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/', (req, res) => {
  res.render('welcome');
});

app.get('/logout', (req, res) => {
  // Clear the 'jwt' cookie by setting it to an empty string and expiring it
  res.cookie('jwt', '', { expires: new Date(0), httpOnly: true });

  // Redirect the user to the home page or login page after logout
  res.redirect('/'); // Replace '/' with the desired destination after logout
});


// Route handler for the admin panel page
app.get('/adminPanel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the decoded JWT token

    // Check if the user has admin access
    const user = await User.findById(userId);

    if (!user || !user.adminAccess) {
      // If the user does not have admin access, redirect them to the home page or some other page
      console.log("User doesn't have adminAccess."); // Log this message for debugging
      return res.redirect('/home');
    }

    // If the user has admin access, fetch all users from the database and render the adminPanel view
    const users = await User.find({});
    res.render('adminPanel', { users });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


/////post routes goes here
app.post('/upload', authenticateToken, upload.single('imageFile'), async (req, res) => {
  const userId = req.user.userId; // Extract the userId from the authenticated user

  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    // Check if the user has create access
    if (!user.create) {
      return res.status(403).send('You are not allowed to post images.');
    }

    // Check if a file was uploaded
    if (req.file) {
      console.log('File uploaded:', req.file);
      // Create a new post document with the file path and caption
      const newPost = new Post({
        filename: req.file.filename,
        filepath: req.file.path,
        caption: req.body.caption
        // user: userId, // Assign the user ID to the post
      });

      // Save the post to the database
      await newPost.save();
      console.log('Post saved to the database:', newPost);
      res.redirect('/home');
    } else {
      console.log('No file uploaded');
      res.redirect('/error'); // Handle the case when no file is uploaded
    }
  } catch (error) {
    console.error('Error saving post to the database:', error);
    res.redirect('/error');
  }
});


// Route to handle post deletion
app.post('/delete/:postId', authenticateToken, async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId; // Extract the userId from the authenticated user

  try {
    // Find the post by its ID
    const post = await Post.findById(postId);

    // Check if the post exists
    if (!post) {
      console.log('Post not found.');
      return res.status(404).send('Post not found.');
    }

    // Check if the user has delete access
    const user = await User.findById(userId);
    if (!user.delete) {
      console.log('User does not have delete access.');
      return res.status(403).send('You are not allowed to delete this post.');
    }

    // Delete the image file from the local system
    fs.unlinkSync(post.filepath); // Delete the image file associated with the post

    // Remove the post from the database
    await Post.findByIdAndRemove(postId);

    // Redirect back to the home page after successful deletion
    res.redirect('/home');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


app.post('/register', async (req, res) => {
  const { name, email, password, admin, adminCode } = req.body;

  try {
    // Check if the user is registering as an admin
    const isAdmin = admin === 'true' && adminCode === process.env.ADMIN_CODE;

    // Hash the user's password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user with the appropriate adminAccess value
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      adminAccess: isAdmin,
    });

    // Save the user to the database
    await newUser.save();

    // Generate a JWT token with user data (e.g., user ID and role)
    const token = jwt.sign({ userId: newUser._id, isAdmin: isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Set the token as an HTTP-only cookie in the response
    res.cookie('jwt', token, { httpOnly: true });

    // Redirect to a success page or login page
    res.redirect('/home');
  } catch (error) {
    console.error('Error during user registration:', error);
    // Handle errors appropriately in your application
    res.status(500).send('Error during user registration');
  }
});


// Route to handle user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user with the given email in the database
    const user = await User.findOne({ email });

    // If the user with the given email is not found, show an error message
    if (!user) {
      return res.status(404).send('User not found. Please check your email and try again.');
    }

    // Compare the provided password with the user's hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // If the password does not match, show an error message
    if (!isPasswordMatch) {
      return res.status(401).send('Invalid password. Please try again.');
    }

    // If the email and password are correct, generate a JWT token
    const token = jwt.sign({ userId: user._id, isAdmin: user.adminAccess }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the token as an HTTP-only cookie in the response
    res.cookie('jwt', token, { httpOnly: true });

    // Redirect to the home page or dashboard after successful login
    res.redirect('/home'); // Replace '/home' with the desired destination after successful login
  } catch (error) {
    console.error('Error during user login:', error);
    // res.render('error'); // Handle errors appropriately in your application
  }
});


// Route to handle form submission for updating user access permissions
app.post('/updateAccess', authenticateToken, async (req, res) => {
  const userIds = req.body.userId; // Get an array of user IDs from the form
  const updates = []; // Create an array to store updates for each user

  // Loop through the user IDs and create an update object for each user
  userIds.forEach(userId => {
    const create = req.body[`create-${userId}`] === 'on';
    const read = req.body[`read-${userId}`] === 'on';
    const deleteUser = req.body[`delete-${userId}`] === 'on';
    const adminAccess = req.body[`adminAccess-${userId}`] === 'on';

    updates.push({
      userId,
      create,
      read,
      delete: deleteUser,
      adminAccess,
    });
  });

  try {
    // Use bulkWrite to perform updates on all users in one go
    const bulkWriteOperations = updates.map(update => ({
      updateOne: {
        filter: { _id: update.userId },
        update: {
          create: update.create,
          read: update.read,
          delete: update.delete,
          adminAccess: update.adminAccess,
        },
      },
    }));

    // Perform the bulk write operations to update users
    await User.bulkWrite(bulkWriteOperations);

    // Redirect back to the admin panel after successful update
    res.redirect('/adminPanel');
  } catch (error) {
    console.error('Error updating user access:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});




// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
