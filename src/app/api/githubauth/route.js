import { github } from "@/lib/oauth/github";
import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { Connect } from "@/app/db/db";
import User from "@/app/Modal/User";

export async function GET(req) {
  await Connect();

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      const state = crypto.randomUUID();
      const url = github.createAuthorizationURL(state, {
        scopes: ["read:user", "user:email", "repo"],
      });
      return NextResponse.redirect(url);
    }

    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // get user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData?.id) {
      throw new Error("Failed to fetch GitHub user profile");
    }

    // get emails (guard for non-array responses)
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailRes.json();
    const primaryEmail = Array.isArray(emails)
      ? emails.find((e) => e.primary)?.email || ""
      : "";
    const verified = Array.isArray(emails)
      ? (emails.find((e) => e.primary)?.verified || false)
      : false;

    let user = await User.findOne({ githubId: userData.id });
    if (!user) {
      user = await User.create({
        githubId: userData.id,
        username: userData.login,
        email: primaryEmail,
        emailVerified: verified,
        avatarUrl: userData.avatar_url,
        accessToken,
      });
    } else {
      user.email = primaryEmail;
      user.emailVerified = verified;
      user.accessToken = accessToken;
      await user.save();
    }

    const response = NextResponse.redirect("http://localhost:3000/Dashboard");
    response.headers.set(
      "Set-Cookie",
      serialize("github_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      })
    );

    return response;
  } catch (err) {
    const message = err?.message || "GitHub OAuth failed";
    return NextResponse.json({ success: false, error: message });
  }
}