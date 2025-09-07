"use client";
import { motion } from "framer-motion";

const Page = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-blue-500/30 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute top-[60%] right-[-15%] w-[500px] h-[500px] bg-purple-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] bg-pink-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

      {/* Top Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-7xl font-extrabold text-white mb-6 text-center drop-shadow-2xl"
      >
        Welcome to <span className="text-blue-400">MyReadMEs</span> 🚀
      </motion.h1>

      {/* Sub Heading / Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="text-xl text-gray-300 italic text-center max-w-2xl mb-10"
      >
        "Your code deserves to be understood. Let your repositories tell your story with beautifully generated READMEs." 💡
      </motion.p>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="p-10 bg-gray-900/60 rounded-3xl shadow-2xl backdrop-blur-lg text-center border border-gray-700 max-w-md mx-4"
      >
        {/* Sub Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 mb-8 text-lg"
        >
          Login with your GitHub and instantly create stunning READMEs for your repositories.
        </motion.p>

        {/* GitHub Button */}
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 20px rgba(59,130,246,0.7)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            window.location.href = "/api/githubauth";
          }}
          className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition mx-auto"
        >
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub Logo"
            className="w-6 h-6"
          />
          Continue with GitHub
        </motion.button>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 text-sm text-gray-500"
        >
          ✨ Powered by <span className="text-blue-400">GEMINI-AI</span> + <span className="text-white">GitHub</span>
        </motion.div>
      </motion.div>

      {/* Tailwind Blob Animation CSS */}
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
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}

export default Page;
