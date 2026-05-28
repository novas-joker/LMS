import { Webhook } from "svix";
import User from "../models/user.js";
import { request } from "express";
import Stripe from "stripe"
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
//API controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
    await whook.verify(JSON.stringify(req.body), {
      'svix-id': req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    })
    const { data, type } = req.body
    switch (type) {
      case 'user.created': {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        }
        await User.create(userData)
        res.json({})
        break;
      }
      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        }
        await User.findByIdAndUpdate(data.id, userData)
        res.json({})
        break;
      }
      case 'user.deleted': {
        await User.findByIdAndDelete(data.id)
        res.json({})
        break;
      }
      default:
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

export const stripeWebhooks = async (request, response) => {
  console.log("[stripeWebhooks] called");
  const sig = request.headers['stripe-signature'];
  let event;
  try {
    event = Stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("[stripeWebhooks] event type:", event.type);
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    return response.sendStatus(400);
  }
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log("[stripeWebhooks] payment_intent.succeeded for:", paymentIntent.id);
        const paymentIntentId = paymentIntent.id;
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        });
        console.log("[stripeWebhooks] session found:", session.data.length);
        
        if (session.data.length === 0) {
          console.log("[stripeWebhooks] No checkout session found for this payment intent");
          break;
        }

        const { purchaseId } = session.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.log("[stripeWebhooks] Purchase not found for ID:", purchaseId);
          break;
        }

        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId.toString());

        if (!userData || !courseData) {
          console.log("[stripeWebhooks] User or Course not found in database.");
          break;
        }

        // Avoid duplicate enrollment if webhook fires twice
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id); // Push _id string, not whole userData document to avoid Mongoose CastError
          await courseData.save();
        }
        
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save();
        }

        purchaseData.status = "completed";
        await purchaseData.save();
        console.log("[stripeWebhooks] Purchase marked completed:", purchaseId);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log("[stripeWebhooks] payment_intent.payment_failed for:", paymentIntent.id);
        const paymentIntentId = paymentIntent.id;
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        });
        console.log("[stripeWebhooks] session found:", session.data.length);
        
        if (session.data.length > 0) {
          const { purchaseId } = session.data[0].metadata;
          const purchaseData = await Purchase.findById(purchaseId);
          if (purchaseData) {
            purchaseData.status = 'failed';
            await purchaseData.save();
            console.log("[stripeWebhooks] Purchase marked failed:", purchaseId);
          }
        }
        break;
      }
      // ... handle other event types
      default:
        console.log(`[stripeWebhooks] Unhandled event type ${event.type}`);
    }
  } catch (dbError) {
    console.log("❌ Error during webhook database update:", dbError.message);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
}