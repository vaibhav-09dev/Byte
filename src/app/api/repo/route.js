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

    // 🔹 DB me save/update (resolve language if missing)
    for (const repo of repos) {
      let primaryLanguage = repo.language || "";
      if (!primaryLanguage) {
        try {
          const langsRes = await fetch(`https://api.github.com/repos/${repo.full_name}/languages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const langs = await langsRes.json();
          if (langs && typeof langs === "object") {
            const entries = Object.entries(langs);
            if (entries.length > 0) {
              entries.sort((a, b) => b[1] - a[1]);
              primaryLanguage = entries[0][0];
            }
          }
        } catch {}
      }

      await Repository.updateOne(
        { repoId: repo.id.toString(), userId: user._id },
        {
          $set: {
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            htmlUrl: repo.html_url,
            description: repo.description,
            language: primaryLanguage,
            repoUpdatedAt: repo.updated_at ? new Date(repo.updated_at) : undefined,
            repoPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : undefined,
          },
        },
        { upsert: true }
      );
    }

    const publicCount = repos.filter(r => !r.private).length;
    const privateCount = repos.filter(r => r.private).length;
    return NextResponse.json({ success: true, repos, count: repos.length, publicCount, privateCount, scopes }, { status: 200 });
  } catch (error) {
    console.error("Repo Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch repos" }, { status: 500 });
  }
}
