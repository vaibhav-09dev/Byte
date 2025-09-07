import { Connect } from "@/app/db/db";
import Repository from "@/app/Modal/Repository";
import User from "@/app/Modal/User";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req) {
  await Connect();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("github_token")?.value;

    console.log("Repo Route: Token from cookies:", token ? "present" : "missing");

    if (!token) {
      return NextResponse.json({ success: false, error: "No token found" }, { status: 401 });
    }

    // 🔹 GitHub user fetch
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();
    const scopes = userRes.headers.get("x-oauth-scopes") || "";

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: "Invalid GitHub token" }, { status: 401 });
    }

    // 🔹 DB user find / create
    let user = await User.findOne({ githubId: userData.id });
    if (!user) {
      user = await User.create({
        githubId: userData.id,
        username: userData.login,
        email: userData.email || "",
        avatarUrl: userData.avatar_url,
        accessToken: token,
      });
    }

    // 🔹 GitHub se repos fetch (private + public)
    const repoRes = await fetch(
      "https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const repos = await repoRes.json();

    if (!Array.isArray(repos)) {
      return NextResponse.json({ success: false, error: "Failed to fetch repos from GitHub" }, { status: 500 });
    }

    // 🔹 DB me save/update
    for (const repo of repos) {
      await Repository.updateOne(
        { repoId: repo.id.toString(), userId: user._id },
        {
          $set: {
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            htmlUrl: repo.html_url,
            description: repo.description,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, repos, count: repos.length, scopes }, { status: 200 });
  } catch (error) {
    console.error("Repo Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch repos" }, { status: 500 });
  }
}
