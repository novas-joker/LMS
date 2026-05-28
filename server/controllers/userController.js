import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js";
import { Purchase } from "../models/Purchase.js"
import User from "../models/user.js"
import Stripe from "stripe";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        res.json({ success: true, user })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//Users Enrolled courses with Lecture Links
export const userEnrolledCourses = async (req, res) => {
    try {
        const { userId } = req.auth()
        const userData = await User.findById(userId).populate('enrolledCourses');
        res.json({ success: true, enrolledCourses: userData.enrolledCourses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const purchaseCourse = async (req, res) => {
    try {
        console.log("[purchaseCourse] called with body:", req.body);
        const { courseId } = req.body;
        const { origin } = req.headers;
        const { userId } = req.auth();
        console.log("[purchaseCourse] userId:", userId, "courseId:", courseId);
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        if (!userData || !courseData) {
            if (!userData) {
                console.log("[purchaseCourse] User not found");
                return res.json({ success: false, message: 'User not Found' });
            }
            if (!courseData) {
                console.log("[purchaseCourse] Course not found");
                return res.json({ success: false, message: 'Course not Found' });
            }
        }
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        };
        const newPurchase = await Purchase.create(purchaseData);
        console.log("[purchaseCourse] Created purchase:", newPurchase._id);

        // Stripe Gateway initialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();
        // Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        });
        console.log("[purchaseCourse] Stripe session created:", session.id, session.url);
        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log("[purchaseCourse] error:", error);
        res.json({ success: false, message: error.message });
    }
}

//update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId, lectureId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: false, message: "Lecture already completed" })
            }
            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
        }
        else {
            const newProgress = await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }
        res.json({ success: true, message: "Progress Updated" });

    }
    catch (error) {
        res.json({ success: false, message: error.message });

    }
}
//get User Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const { userId } = req.auth();
        const courseId = req.body?.courseId || req.query?.courseId;

        if (!courseId) {
            return res.json({ success: false, message: "Course ID is required" });
        }

        const progressData = await CourseProgress.findOne({ userId, courseId });
        if (!progressData) {
            return res.json({ success: false, message: "No progress found" });
        }
        res.json({ success: true, progressData });
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
}

//Add User Ratings to Course
export const addUserRatings = async (req, res) => {
    const { userId } = req.auth();
    const { courseId, rating } = req.body;
    if (!courseId || !userId || !rating || rating > 5) {
        return res.json({ success: false, message: 'Invalid Details' });

    }
    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.json({ success: false, message: "Course Not Found" })
        }

        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: "User Not Found or User has not purchased this course" })
        }
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)
        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        }
        else {
            course.courseRatings.push({ userId, rating });
        }
        await course.save();
        return res.json({ success: true, message: 'Rating Added Successfully' })
    }
    catch (error) {
        res.json({ success: false, message: error.message });
    }
}