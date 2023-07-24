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

const port = 3000;

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
const User = mongoose.model('User', userSchema);

// Define the admin model for admin users
const Admin = User.discriminator('Admin', adminAccessSchema);

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

const Post = mongoose.model('Post', postSchema);


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
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.redirect('/login');
    }

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

    const formattedPosts = posts.map(post => ({
      ...post._doc,
      timestamp: timeSince(post.createdAt), // Add the formatted timestamp as a new property
    }));

    res.render('home', { posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    // res.render('error'); // Handle errors appropriately in your application
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
  res.cookie('jwt', '', { expires: new Date(0), httpOnly: true });

  res.redirect('/');
});


// Route handler for the admin panel page
app.get('/adminPanel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user || !user.adminAccess) {
      console.log("User doesn't have adminAccess."); // Log this message for debugging
      return res.redirect('/home');
    }

    const users = await User.find({});
    res.render('adminPanel', { users });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


/////post routes goes here
app.post('/upload', authenticateToken, upload.single('imageFile'), async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user.create) {
      return res.status(403).send('You are not allowed to post images.');
    }

    if (req.file) {
      console.log('File uploaded:', req.file);
      const newPost = new Post({
        filename: req.file.filename,
        filepath: req.file.path,
        caption: req.body.caption
      });

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
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);

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

    fs.unlinkSync(post.filepath); // Delete the image file associated with the post

    // Remove the post from the database
    await Post.findByIdAndRemove(postId);

    res.redirect('/home');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


app.post('/register', async (req, res) => {
  const { name, email, password, admin, adminCode } = req.body;

  try {
    const isAdmin = admin === 'true' && adminCode === process.env.ADMIN_CODE;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      adminAccess: isAdmin,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, isAdmin: isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie('jwt', token, { httpOnly: true });

    res.redirect('/home');
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).send('Error during user registration');
  }
});


// Route to handle user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

      if (!user) {
      return res.status(404).send('User not found. Please check your email and try again.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).send('Invalid password. Please try again.');
    }

    const token = jwt.sign({ userId: user._id, isAdmin: user.adminAccess }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('jwt', token, { httpOnly: true });

    res.redirect('/home');
  } catch (error) {
    console.error('Error during user login:', error);
    // res.render('error'); // Handle errors appropriately in your application
  }
});

// Route to handle form submission for updating user access permissions
app.post('/updateAccess', authenticateToken, async (req, res) => {
  const userIds = req.body.userId;
  const updates = [];

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

    await User.bulkWrite(bulkWriteOperations);

    res.redirect('/adminPanel');
  } catch (error) {
    console.error('Error updating user access:', error);
    res.render('error'); // Handle errors appropriately in your application
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
