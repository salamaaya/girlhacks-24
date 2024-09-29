import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from './config/db.js';

import router from "./routes/user.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());
app.use(cors());

app.use("/api/user", router);

// listen on port 3000
app.listen(3000, () => { 
    connectDB();
    console.log("Server started at http://localhost:" + PORT);
}); 