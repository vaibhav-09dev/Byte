import { NextResponse } from "next/server";
import {Connect} from "@/app/db/db";
import User from "@/app/Modal/User";
Connect();
export async function POST(req) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    await Connect();

    // GitHub API se user ka data lo
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json();

    // Agar email chahiye to ek aur API call
   const emailRes = await fetch("https://api.github.com/user/emails", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const emails = await emailRes.json();
const primaryEmail = Array.isArray(emails)
  ? emails.find((e) => e.primary && e.verified)?.email || ""
  : "";

let dbUser = await User.findOne({ githubId: user.id });
if (!dbUser) {
  dbUser = await User.create({
    githubId: user.id,
    username: user.name || user.login,          // fallback to login
    email: user.email || "", // fallback if available
    avatar: user.avatar_url,
    accessToken,
  });
} else {
  dbUser.username = user.name || user.login;
  dbUser.email = primaryEmail || user.email || dbUser.email;
  dbUser.avatar = user.avatar_url;
  dbUser.accessToken = accessToken;
  await dbUser.save();
}


    return NextResponse.json({ success: true, user: dbUser });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
