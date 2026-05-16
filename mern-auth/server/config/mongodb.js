import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retries = MAX_RETRIES) => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const uri = rawUri.trim();
  const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
  console.log("🔌 Attempting to connect to:", maskedUri);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected Successfully");

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
      connectDB(MAX_RETRIES).catch((err) => console.error("Reconnect failed:", err.message));
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retries > 0) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} attempts left)`);
      await wait(RETRY_DELAY_MS);
      return connectDB(retries - 1);
    }

    console.error("💀 All connection attempts exhausted.");
    console.error("   ➡  Check your MongoDB URI, Atlas IP whitelist, and local network DNS settings.");
    throw error;
  }
};

export default connectDB;