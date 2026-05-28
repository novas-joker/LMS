import express from "express";
import { addCourse, updateRoleToEducator ,getEducatorCourses, educatorDashboardData ,getEnrolledStudentsData                                                                  } from "../controllers/educatorController.js";
import { requireAuth } from "@clerk/express";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

// TEST ROUTE
educatorRouter.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.send("EDUCATOR ROUTE WORKING");
});

// UPDATE ROLE
educatorRouter.post(
  "/update-role",
  requireAuth(),
  (req, res, next) => {
    console.log("STEP 1: update-role auth passed");
    next();
  },
  updateRoleToEducator
);

// ADD COURSE (FULL DEBUG FLOW)
educatorRouter.post(
  "/add-course",

  // STEP 1
  (req, res, next) => {
    console.log("STEP 1: route hit");
    next();
  },

  // STEP 2
  requireAuth(),

  (req, res, next) => {
    console.log("STEP 2: auth passed");
    next();
  },

  // STEP 3
  upload.single("image"),

  (req, res, next) => {
    console.log("STEP 3: multer passed");
    next();
  },

  // STEP 4
  protectEducator,

  (req, res, next) => {
    console.log("STEP 4: educator verified");
    next();
  },

  // FINAL
  addCourse
);
educatorRouter.get('/courses',protectEducator,getEducatorCourses);
educatorRouter.get('/dashboard',protectEducator,educatorDashboardData);
educatorRouter.get('/enrolled-students',protectEducator,getEnrolledStudentsData);

export default educatorRouter;