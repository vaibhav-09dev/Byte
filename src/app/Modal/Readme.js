import mongoose from "mongoose";

const readmeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: "Repository" },
  content: String,
   sha: { type: String, default: null }, 
  model: String,
}, { timestamps: true });

export default mongoose.models.Readme || mongoose.model("Readme", readmeSchema);
