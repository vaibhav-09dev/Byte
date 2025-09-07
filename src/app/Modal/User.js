import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: String,
  email: String,
  emailVerified: { type: Boolean, default: false },
  avatarUrl: String,
  accessToken: String, // secure store kar
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
