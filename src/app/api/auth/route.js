import { Connect } from "@/app/db/db";
import User from "@/app/Modal/User";
import Repository from "@/app/Modal/Repository";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  await Connect();

  try {
    const cookieStore =await cookies();
const token =  cookieStore.get("github_token")?.value;
console.log("Auth Route: Retrieved token from cookies:", token ? "present" : "missing");

if (!token) {
  return NextResponse.json({ success: false, error: "Not authenticated" });
}

    
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();
    const scopes = userRes.headers.get("x-oauth-scopes") || "";

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: "Invalid GitHub token" }, { status: 401 });
    }

    let user = await User.findOne({ githubId: userData.id });
    if (!user) {
      user = await User.create({
        githubId: userData.id,
        username: userData.name || userData.login,
        email: userData.email || "",
        avatar: userData.avatar_url,
      });
    }

  
    const repoRes = await fetch("https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const repos = await repoRes.json();

   
    const savedRepos = await Promise.all(
      repos.map((r) =>
        Repository.findOneAndUpdate(
          { repoId: r.id, userId: user._id },
          {
            name: r.name,
            fullName: r.full_name,
            private: r.private,
            description: r.description,
            htmlUrl: r.html_url,
          },
          { upsert: true, new: true }
        )
      )
    );

    return NextResponse.json({ success: true, user, repos: savedRepos, scopes });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
