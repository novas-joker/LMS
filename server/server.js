import express from "express";
import cors from "cors";
import 'dotenv/config';
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks } from "./controllers/webhooks.js";

 //initailize express
const app = express();

// connect to database
await connectDB()

 //middlewares
app.use(cors());

 //routes
app.get('/',(req,res)=>res.send("API working"));
app.post('/clerk',express.json(),clerkWebhooks);

 //port
const PORT = process.env.PORT || 5000;

 //listen
app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})
