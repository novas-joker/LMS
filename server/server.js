import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/webhooks.js";

const app = express();

console.log("Server starting...");

await connectDB();
await connectCloudinary();

app.use(cors());

// Stripe raw webhook endpoint must be placed before global express.json() parser
app.post("/stripe", express.raw({type:'application/json'}), stripeWebhooks);

app.use(express.json());

// GLOBAL LOGGER
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

app.get("/", (req, res) => res.send("API working"));

app.use("/api/educator", educatorRouter);
app.use("/api/course", express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter)
app.listen(5000, () => {
  console.log("Server running on 5000");
});