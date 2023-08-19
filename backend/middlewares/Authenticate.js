import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";

const authenticateToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(" ")[1];
  }
  
  // console.log("Token", token);

  if (!token) {
    return res.status(401).send( 'No token provided' );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.redirect('/login');
    }

    req.user = {
      userId: decodedToken.userId,
      //isAdmin: decodedToken.isAdmin,
      // create: decodedToken.create,
      // delete: decodedToken.delete,
      // post: decodedToken.post,
      adminAccess: decodedToken.adminAccess
    };
    next();
  });
};

export default authenticateToken;