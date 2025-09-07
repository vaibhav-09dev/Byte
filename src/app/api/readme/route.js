import { NextResponse } from "next/server";
import Repository from "@/app/Modal/Repository";
import User from "@/app/Modal/User";
import { Connect } from "@/app/db/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  await Connect();
  try {
    const { userId, repoId, bulk } = await req.json();

    const buildFallbackReadme = (repo) => {
      const title = repo?.name || "Project";
      const description = repo?.description || "Add a concise description of your project here.";
      const url = repo?.htmlUrl || "";
      return `# ${title}

${description}

${url ? `Repository: ${url}\n` : ""}

## Features
- Clear, concise description of key features
- Add bullets that explain the value

## Getting Started
1. Clone the repo
2. Install dependencies
3. Run the project

## Scripts
- describe your npm/yarn scripts here

## Contributing
Contributions are welcome! Please open an issue or PR.

## License
This project is licensed. Add your license details here.
`;
    };

    if (bulk) {
      // Generate readmes for all repos of the user
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const repos = await Repository.find({ userId: user._id });
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const results = [];
      for (const repo of repos) {
        const prompt = `Generate a professional GitHub README for repository ${repo.name}.
Description: ${repo.description || "No description"}
Repository URL: ${repo.htmlUrl}`;
        try {
          // If no API key, skip to fallback
          if (!process.env.GEMINI_API_KEY) throw new Error("missing_api_key");
          const result = await model.generateContent(prompt);
          const text = result.response?.text?.() || "";
          if (text.trim().length === 0) {
            const fallback = buildFallbackReadme(repo);
            results.push({ repoId: repo._id.toString(), fullName: repo.fullName, content: fallback, fallback: true });
          } else {
            results.push({ repoId: repo._id.toString(), fullName: repo.fullName, content: text });
          }
        } catch (err) {
          const fallback = buildFallbackReadme(repo);
          results.push({ repoId: repo._id.toString(), fullName: repo.fullName, content: fallback, fallback: true, reason: err?.message || "generation_failed" });
        }
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

      try {
        if (!process.env.GEMINI_API_KEY) throw new Error("missing_api_key");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const text = result.response?.text?.() || "";
        if (text.trim().length === 0) {
          const fallback = buildFallbackReadme(repo);
          return NextResponse.json({ success: true, readme: { content: fallback, fallback: true } });
        }
        return NextResponse.json({ success: true, readme: { content: text } });
      } catch (err) {
        const fallback = buildFallbackReadme(repo);
        return NextResponse.json({ success: true, readme: { content: fallback, fallback: true, reason: err?.message || "generation_failed" } });
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to generate README" }, { status: 500 });
  }
}
