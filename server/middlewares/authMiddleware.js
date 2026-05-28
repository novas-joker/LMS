import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const protectEducator = async (req, res, next) => {
  try {
    console.log("protectEducator start");

    const { userId } = req.auth();

    if (!userId) {
      console.log("No userId");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    console.log("User role:", user.publicMetadata.role);

    if (user.publicMetadata.role !== "educator") {
      console.log("Not educator");
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("Educator verified");
    next();
  } catch (error) {
    console.log("protectEducator error:", error);
    return res.json({ success: false, message: error.message });
  }
};