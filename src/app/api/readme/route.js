import { NextResponse } from "next/server";
import Repository from "@/app/Modal/Repository";
import User from "@/app/Modal/User";
import { Connect } from "@/app/db/db";
import { geminiModel } from "@/lib/gemni";


export async function POST(req) {
  await Connect();
  try {
    const { userId, repoId, bulk } = await req.json();

    if (bulk) {
      
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const repos = await Repository.find({ userId: user._id });

      const results = [];
      for (const repo of repos) {
        const prompt = `Generate a professional GitHub README for repository ${repo.name}.
Description: ${repo.description || "No description"}
Repository URL: ${repo.htmlUrl}`;
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is missing");
        }
        const result = await geminiModel.generateContent(prompt);
        const text = result?.response?.text?.() || "";
        results.push({ repoId: repo._id.toString(), fullName: repo.fullName, content: text });
      }

      return NextResponse.json({ success: true, readmes: results });
    } else {
      const user = await User.findById(userId);
      const repo = await Repository.findById(repoId);

      if (!user || !repo) {
        return NextResponse.json({ success: false, error: "User or Repo not found" }, { status: 404 });
      }

      const prompt = `Generate a professional GitHub README for repository ${repo.name}.
    Description: ${repo.description || "No description"}
    Repository URL: ${repo.htmlUrl}`;

      const result = await geminiModel.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      return NextResponse.json({ success: true, readme: { content: text } });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to generate README" }, { status: 500 });
  }
}
