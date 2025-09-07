import { NextResponse } from "next/server";
import axios from "axios"; 
import { Connect } from "@/app/db/db";
import User from "@/app/Modal/User";
import Repository from "@/app/Modal/Repository";

export async function PUT(req) {
  try {
    const { token, repoFullName, content, bulk, userId, repoId } = await req.json();

    console.log(
      "pushReadme: Received request with token:",
      token ? "present" : "missing",
      "repoFullName:", repoFullName,
      "content length:", content ? content.length : "missing"
    );

    if (!bulk && !(content && ((token && repoFullName) || (userId && repoId)))) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Single push path using userId+repoId (server-side token lookup)
    if (!bulk && userId && repoId && content) {
      await Connect();
      const user = await User.findById(userId);
      const repo = await Repository.findById(repoId);
      if (!user || !user.accessToken || !repo) {
        return NextResponse.json({ success: false, error: "User or repo not found" }, { status: 404 });
      }

      // Recurse into self with a PUT to push using token + fullName
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/pushReadme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.accessToken, repoFullName: repo.fullName, content })
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Bulk path: generate and push for all repos of user
    if (bulk) {
      await Connect();
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        return NextResponse.json({ success: false, error: "User not found or missing token" }, { status: 404 });
      }
      const repos = await Repository.find({ userId: user._id });

      const results = [];
      for (const repo of repos) {
        try {
          // Step A: ensure we have content from readme endpoint (client may already have it, but generate simple default here if not)
          const defaultContent = `# ${repo.name}\n\n${repo.description || ""}\n\n[View Repo](${repo.htmlUrl})`;
          const pushContent = content && repo.fullName === repoFullName ? content : defaultContent;

          const pushRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/pushReadme`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: user.accessToken, repoFullName: repo.fullName, content: pushContent })
          });
          const data = await pushRes.json();
          results.push({ fullName: repo.fullName, success: data.success, error: data.error });
        } catch (e) {
          results.push({ fullName: repo.fullName, success: false, error: e.message });
        }
      }

      return NextResponse.json({ success: true, results });
    }

    // Step 0: Resolve default branch from repo metadata and detect empty repos
    let branch = "main";
    let isEmptyRepo = false;
    try {
      const repoInfo = await axios.get(
        `https://api.github.com/repos/${repoFullName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "byte-readme-builder",
          },
        }
      );
      branch = repoInfo.data?.default_branch || branch;
      isEmptyRepo = (repoInfo.data?.size === 0);
      console.log("pushReadme: default_branch:", branch);
    } catch (e) {
      console.log("pushReadme: could not fetch repo info, defaulting branch to", branch);
    }

    if (isEmptyRepo) {
      return NextResponse.json(
        { success: false, error: "Repository is empty. Make an initial commit (README/license or any file) before pushing via API." },
        { status: 409 }
      );
    }

    // Step 1: Fetch existing README
    let sha = null;
    const tryGetReadme = async (tryBranch) => {
      try {
        const readmeRes = await axios.get(
          `https://api.github.com/repos/${repoFullName}/contents/README.md?ref=${encodeURIComponent(tryBranch)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "byte-readme-builder",
            },
          }
        );
        return { sha: readmeRes.data.sha, branch: tryBranch };
      } catch (e) {
        if (e.response?.status === 404) return { sha: null, branch: tryBranch };
        throw e;
      }
    };

    // Attempt default branch, then master as fallback for legacy repos
    try {
      const info = await tryGetReadme(branch);
      sha = info.sha;
    } catch (e) {
      console.log("pushReadme: error on default branch read, will try master", e.response?.status || e.message);
    }
    if (sha === undefined) {
      const info = await tryGetReadme("master");
      branch = info.branch;
      sha = info.sha;
    }

    // Step 2: Build payload
    const payload = {
      message: sha
        ? "chore: update README.md via dashboard"
        : "chore: create README.md via dashboard",
      content: Buffer.from(content).toString("base64"),
      branch,
    };
    if (sha) {
      payload.sha = sha; // attach actual sha if updating
    }

    console.log("pushReadme: Sending PUT with payload:", {
      message: payload.message,
      branch: payload.branch,
      sha: sha || "null",
      contentLength: content.length,
    });

    // Step 3: Push update
    const putOnce = async (overrideBranch) => {
      const body = { ...payload };
      if (overrideBranch) body.branch = overrideBranch;
      return axios.put(
        `https://api.github.com/repos/${repoFullName}/contents/README.md`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "byte-readme-builder",
          },
        }
      );
    };

    let res;
    try {
      res = await putOnce(branch);
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message;
      console.log("pushReadme: first PUT failed", status, msg, "retrying with master");
      try {
        res = await putOnce("master");
      } catch (e2) {
        console.error("pushReadme: second PUT failed", e2.response?.status, e2.response?.data || e2.message);
        throw e2;
      }
    }

    console.log("pushReadme: Successfully updated README ✅");
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    console.error("Error in pushReadme:", err.response?.data || err.message);
    return NextResponse.json(
      { success: false, error: err.response?.data || err.message },
      { status: 500 }
    );
  }
}
