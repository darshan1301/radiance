// Required dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_mysql_username',
  password: 'your_mysql_password',
  database: 'your_database_name',
});

// Connect to MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Configure Passport.js
passport.use(new LocalStrategy((username, password, done) => {
  // Query the MySQL database for user with the provided username
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
    if (err) {
      return done(err);
    }
    if (!rows.length) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const user = rows[0];
    // Verify the password
    if (password !== user.password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Query the MySQL database for user with the provided id
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) {
      return done(err);
    }
    done(null, rows[0]);
  });
});

// Create the Express app
const app = express();

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Define routes
app.get('/', (req, res) => {
  res.send('Home page');
});

app.get('/login', (req, res) => {
  res.send('Login page');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
}));

app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Welcome to the dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
