import mongoose from "mongoose";

const repoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  repoId: String,
  name: String,
  fullName: String,
  private: Boolean,
  htmlUrl: String,
  description: String,
  language: String,
  repoUpdatedAt: Date,
  repoPushedAt: Date,
}, { timestamps: true });

export default mongoose.models.Repository || mongoose.model("Repository", repoSchema);
