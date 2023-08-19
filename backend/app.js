import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
config();
import { fileURLToPath } from "url";
import cors from "cors";
import userRouter from "./routes/user.js";
import postRouter from "./routes/post.js";
import { connectMongoDB } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const port = process.env.PORT;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
///////////SERVE STATIC FILEs (IMAGES)
app.use(
  "/userUploadedFiles",
  express.static(path.join(__dirname, "userUploadedFiles"))
);
//////////////DATABASE CONNECTION
connectMongoDB();


///////////////ROUTES
app.use("/user", userRouter);
app.use("/post", postRouter);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
