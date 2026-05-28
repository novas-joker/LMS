import express from 'express';
import { requireAuth } from '@clerk/express';
import { getUserData, purchaseCourse, userEnrolledCourses, updateUserCourseProgress, getUserCourseProgress, addUserRatings } from '../controllers/userController.js';
const userRouter = express.Router();
userRouter.get("/data", requireAuth(), getUserData)
userRouter.get('/enrolled-courses', requireAuth(), userEnrolledCourses)
userRouter.post('/purchase', requireAuth(), purchaseCourse)
userRouter.post('/progress', requireAuth(), updateUserCourseProgress)
userRouter.get('/progress', requireAuth(), getUserCourseProgress)
userRouter.post('/ratings', requireAuth(), addUserRatings);
export default userRouter;