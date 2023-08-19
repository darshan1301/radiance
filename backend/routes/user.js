import express from "express";
import authenticateToken from "../middlewares/authenticate.js";
import {register, login, adminPanelAccess, updateAccess} from "../controllers/userController.js";


const router = express.Router();

// Route handler for the admin panel page
router.get("/adminPanel" , authenticateToken, adminPanelAccess);

/////post routes goes here
router.post("/register", register);

// Route to handle user login
router.post("/login", login);

//UPDATE ADMIN PANEL
router.post("/updateAccess",  authenticateToken, updateAccess);

export default router;