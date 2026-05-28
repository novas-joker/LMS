import { createClerkClient } from "@clerk/backend";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/user.js";


const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// UPDATE ROLE
export const updateRoleToEducator = async (req, res) => {
  try {
    console.log("UPDATE ROLE HIT");

    const { userId } = req.auth();

    if (!userId) {
      console.log("No userId");
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "educator" },
    });

    console.log("Role updated");

    return res.json({
      success: true,
      message: "You can publish a course now",
    });
  } catch (error) {
    console.log("updateRole error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// ADD COURSE
export const addCourse = async (req, res) => {
  try {
    console.log("CONTROLLER HIT");

    const { courseData } = req.body;
    const imageFile = req.file;
    const { userId } = req.auth();

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!imageFile) {
      console.log("No image uploaded");
      return res.json({ success: false, message: "No image" });
    }

    let parsedCourseData;

    try {
      parsedCourseData = JSON.parse(courseData);
      console.log("JSON parsed");
    } catch (err) {
      console.log("JSON parse error:", err.message);
      return res.json({ success: false, message: "Invalid JSON" });
    }

    parsedCourseData.educator = userId;

    const newCourse = await Course.create(parsedCourseData);
    console.log("Course created");

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    console.log("Image uploaded");

    newCourse.courseThumbnail = imageUpload.secure_url;
    await newCourse.save();

    console.log("SENDING RESPONSE");

    return res.json({
      success: true,
      message: "Course Added",
    });
  } catch (error) {
    console.log("Controller error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// Get Educator Courses

export const getEducatorCourses = async(req,res)=>{
  try{
      const { userId } = req.auth();
      console.log("Getting courses for educator:", userId);
      const courses = await Course.find({educator: userId});
      console.log("Found courses:", courses.length);
      res.json({success:true, courses})
  }catch(error){
      console.log("getEducatorCourses error:", error);
      res.json({success:false, message:error.message})
  }
}

//Get Educator dashboard data { Total Earning, EnrolledStudents, No.of Courses }
export const educatorDashboardData = async (req, res) => {
  try{
  const {userId} = req.auth();
  const courses = await Course.find({educator:userId})
  const totalCourses = courses.length;
  const courseIds = courses.map(course=>course._id);

  // calculate total earning from purchases
  const purchases = await Purchase.find({
    courseId: {$in: courseIds},
    status: 'completed'
  })
  const totalEarnings = purchases.reduce((sum,purchase)=> sum+purchase.amount,0);

  // Collect unique enrolled student IDs with their course titles
  const enrolledStudentsData=[];
  for(const course of courses){
    const students = await User.find({
      _id:{$in: course.enrolledStudents}
    },'name imageUrl')
    students.forEach(student=>{
      enrolledStudentsData.push({
        courseTitle: course.courseTitle,
        student
      })
    })
  }
  res.json({success:true,dashboardData:{
    totalEarnings, enrolledStudentsData, totalCourses
  }})
  }
  catch(error){
    res.json({success:false,message:error.message})
  }
}

// Get Enrolled Students Data with Purchase Data

export const getEnrolledStudentsData = async (req,res)=>{
  try{
    const {userId} = req.auth();
    const courses = await Course.find({educator:userId})
    const courseIds = courses.map(course=>course._id);

    const purchases = await Purchase.find({
      courseId: {$in: courseIds},
      status: 'completed'
    }).populate('userId','name imageUrl').populate('courseId','courseTitle')

    const enrolledStudents = purchases.map(purchase => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt
    }));
    res.json({success: true, enrolledStudents});
  }
  catch(error){
    res.json({success: false, message: error.message}); 
  }
} 