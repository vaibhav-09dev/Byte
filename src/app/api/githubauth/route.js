import { NextResponse } from "next/server";
import axios from "axios";
import { Connect } from "@/app/db/db";
import User from "@/app/Modal/User";
import Repository from "@/app/Modal/Repository";
import crypto from "crypto";

export async function GET(request) {
  await Connect();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");


  if (!code) {
    const state = crypto.randomUUID();
    const clientId = process.env.Github_Client_Id || process.env.NEXT_PUBLIC_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/githubauth");
    const scopes = encodeURIComponent("read:user user:email repo");
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;
    return NextResponse.redirect(githubAuthUrl);
  }

  try {
    
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.Github_Client_Id || process.env.NEXT_PUBLIC_CLIENT_ID,
        client_secret: process.env.Github_Client_Secret || process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/githubauth",
      },
      { headers: { Accept: "application/json" } }
    );

    if (!tokenRes.data?.access_token) {
      throw new Error(tokenRes.data?.error_description || "Failed to obtain access token");
    }
    const accessToken = tokenRes.data.access_token;

 
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const githubUser = userRes.data;

 
    const emailRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = emailRes.data;
    const primaryEmail = Array.isArray(emails)
      ? emails.find(e => e.primary)?.email || ""
      : "";
    const verified = Array.isArray(emails)
      ? emails.find(e => e.primary)?.verified || false
      : false;


    let user = await User.findOne({ githubId: githubUser.id });
    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.name || githubUser.login,
        email: primaryEmail,
        emailVerified: verified,
        avatarUrl: githubUser.avatar_url,
        accessToken,
      });
    } else {
      user.username = githubUser.name || githubUser.login;
      user.email = primaryEmail;
      user.emailVerified = verified;
      user.avatarUrl = githubUser.avatar_url;
      user.accessToken = accessToken;
      await user.save();
    }

   
    const reposRes = await axios.get("https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const repos = reposRes.data;

    
    for (const repo of repos) {
      await Repository.updateOne(
        { repoId: String(repo.id), userId: user._id },
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

  
    const sessionToken = crypto.randomBytes(32).toString("hex");
    user.sessionToken = sessionToken;
    await user.save();

   
    const response = NextResponse.redirect("http://localhost:3000/Dashboard");
    response.cookies.set("github_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (err) {
    console.error("OAuth Error:", err.message);
    return NextResponse.json({ error: err.message || "OAuth failed" }, { status: 500 });
  }
}
