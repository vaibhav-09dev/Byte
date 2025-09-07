"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Github, FileText } from "lucide-react";

const Page = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [readmeData, setReadmeData] = useState({});
  const [editingRepoId, setEditingRepoId] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const [loadingRepoId, setLoadingRepoId] = useState(null);
  const [loadingBulkGenerate, setLoadingBulkGenerate] = useState(false);
  const [loadingBulkPush, setLoadingBulkPush] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .post("/api/auth")
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
          setRepos(res.data.repos);
        } else setError(res.data.error || "Login failed");
      })
      .catch(() => setError("Network error"));
  }, []);

  const generateReadme = async (repoId, fullName) => {
    if (!user?._id || !repoId) return setError("Missing fields");

    setLoadingRepoId(repoId);
    setError("");

    try {
      const res = await axios.post("/api/readme", { userId: user._id, repoId });
      if (!res.data.success) throw new Error(res.data.error);

      setReadmeData((prev) => ({
        ...prev,
        [repoId]: {
          content: res.data.readme.content,
          fullName: fullName,
        },
      }));
    } catch (err) {
      setError(err.message);
    }

    setLoadingRepoId(null);
  };

  const generateAllReadmes = async () => {
    if (!user?._id) return setError("Missing user");
    setLoadingBulkGenerate(true);
    setError("");
    try {
      const res = await axios.post("/api/readme", { userId: user._id, bulk: true });
      if (!res.data.success) throw new Error(res.data.error || "Failed to generate");
      const next = { ...readmeData };
      (res.data.readmes || []).forEach((r) => {
        next[r.repoId] = { content: r.content, fullName: r.fullName };
      });
      setReadmeData(next);
    } catch (e) {
      setError(e.message);
    }
    setLoadingBulkGenerate(false);
  };

  const pushAllReadmes = async () => {
    if (!user?._id) return setError("Missing user");
    setLoadingBulkPush(true);
    setError("");
    try {
      const res = await axios.put("/api/pushReadme", { userId: user._id, bulk: true });
      if (!res.data.success) throw new Error(res.data.error || "Failed to push");
    } catch (e) {
      setError(e.message);
    }
    setLoadingBulkPush(false);
  };

  if (error)
    return (
      <div className="text-red-500 text-center font-semibold mt-6">
        ⚠️ {error}
      </div>
    );
  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-blue-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute top-[60%] right-[-15%] w-[500px] h-[500px] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] bg-pink-500/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

      {/* 👋 Top-left Hello */}
      <div className="absolute top-6 left-6 z-20">
        <h2 className="text-2xl font-bold text-white">
          👋 Hello, {user.username}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-8xl mx-auto"
      >
        {/* 🚀 Center Heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col mt-16 items-center text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-white">
            🚀 Welcome to Your Dashboard
          </h1>
          <p className="text-gray-300">
            Manage your repositories and generate READMEs easily
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              className="bg-blue-700 hover:bg-blue-600 text-white"
              onClick={generateAllReadmes}
              disabled={loadingBulkGenerate}
            >
              {loadingBulkGenerate ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" /> Generating for all...
                </>
              ) : (
                <>Generate READMEs for all</>
              )}
            </Button>
            
          </div>
        </motion.div>
        <Card className="bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-3xl mb-10 p-6">
          <CardContent>
           

        <h3 className="text-xl font-semibold text-white mb-4">
          📂 Your Repositories
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {repos.map((repo, i) => (
            <motion.div
              key={repo._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Frosted Glass Card */}
              <Card className="bg-gray-900/60 backdrop-blur-lg border border-gray-700 rounded-3xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-5">
                  <a
                    href={repo.htmlUrl || repo.url}
                    target="_blank"
                    className="flex items-center gap-2 font-semibold text-blue-400 hover:underline text-lg"
                  >
                    <Github size={18} />{" "}
                    {repo.fullName?.split("/")[1] || repo.name || "Unknown"}
                  </a>
                  <p className="text-gray-300 text-sm mt-1">
                    {repo.description}
                  </p>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    {/* Generate README */}
                    <Button
                      size="sm"
                      className="bg-black text-white hover:bg-gray-900"
                      disabled={loadingRepoId === repo._id}
                      onClick={() =>
                        generateReadme(repo._id, repo.fullName)
                      }
                    >
                      {loadingRepoId === repo._id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-1" /> Generate README
                        </>
                      )}
                    </Button>

                    {/* Copy README */}
                    {readmeData[repo._id]?.content && (
                      <Button
                        size="sm"
                        className="bg-purple-800 hover:bg-purple-700 text-white border border-gray-600"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            readmeData[repo._id].content
                          );
                          const toast = document.createElement("div");
                          toast.textContent = "✅ Copied to clipboard!";
                          toast.className =
                            "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out";
                          document.body.appendChild(toast);
                          setTimeout(() => toast.remove(), 2000);
                        }}
                      >
                        Copy
                      </Button>
                    )}

                    {/* Edit & Push */}
                    
                  </div>

                  {/* Generated README Preview */}
                  {readmeData[repo._id]?.content && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-3 bg-gray-800/70 text-gray-100 border border-gray-700 rounded-lg max-h-64 overflow-y-auto font-mono text-sm"
                    >
                      <h4 className="font-semibold mb-2 text-blue-400">
                        📄 Generated README:
                      </h4>
                      <pre className="whitespace-pre-wrap">
                        {readmeData[repo._id].content}
                      </pre>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating editor modal */}
      {editingRepoId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Edit README</h3>
              <div className="flex gap-2">
                <Button
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() => setEditingRepoId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-700 hover:bg-green-600 text-white"
                  onClick={async () => {
                    try {
                      const res = await axios.put("/api/pushReadme", {
                        userId: user._id,
                        repoId: editingRepoId,
                        content: editorValue,
                      });
                      if (!res.data.success) throw new Error(res.data.error || "Failed to push");
                      const toast = document.createElement("div");
                      toast.textContent = "✅ Pushed README to GitHub";
                      toast.className =
                        "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out";
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 2000);
                      setEditingRepoId(null);
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Push to GitHub
                </Button>
              </div>
            </div>
            <textarea
              className="w-full h-96 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg p-3 font-mono text-sm"
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Page;
