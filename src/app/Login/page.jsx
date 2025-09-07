"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Github, Sparkles, Shield, Zap } from "lucide-react";

const flipWords = ["Fast ⚡", "Secure 🔒", "Beautiful 🎨"];
const quotes = [
  "“Code is read more often than it is written.”",
  "“Good docs = Happy developers.”",
  "“Your repo deserves a story, not just code.”",
];

export default function Page() {
  const [showWhy, setShowWhy] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Flip words
  useEffect(() => {
    const interval = setInterval(
      () => setWordIndex((prev) => (prev + 1) % flipWords.length),
      2500
    );
    return () => clearInterval(interval);
  }, []);

  // Rotating quotes
  useEffect(() => {
    const qInterval = setInterval(
      () => setQuoteIndex((prev) => (prev + 1) % quotes.length),
      5000
    );
    return () => clearInterval(qInterval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6">
   
      <motion.h1
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 text-center drop-shadow-2xl leading-tight px-2"
      >
        Welcome to{" "}
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
          MyReadMEs
        </span>{" "}
        🚀
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-base sm:text-lg md:text-xl text-gray-300 italic text-center max-w-xs sm:max-w-md md:max-w-2xl mb-6 px-2"
      >
        "Your code deserves to be understood. Let your repositories tell your
        story with beautifully generated READMEs."
      </motion.p>

      {/* Flip Words */}
      <div className="h-8 sm:h-10 mb-6 text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-blue-300"
          >
            {flipWords[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative p-6 sm:p-8 md:p-10 bg-gray-900/60 rounded-3xl shadow-2xl backdrop-blur-lg text-center border border-gray-700 max-w-sm sm:max-w-md md:max-w-lg mx-4"
      >
        {/* Glowing border */}
        <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/20 animate-pulse pointer-events-none"></div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 mb-8 text-sm sm:text-base md:text-lg"
        >
          Login with your GitHub and instantly create stunning READMEs for your
          repositories.
        </motion.p>

        {/* Button with shimmer */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (window.location.href = "/api/githubauth")}
          className="relative flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-2 sm:py-3 rounded-xl bg-white text-black text-sm sm:text-base font-semibold overflow-hidden group mx-auto"
        >
          <Github className="w-5 h-5 sm:w-6 sm:h-6" />
          Continue with GitHub
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
        </motion.button>

        {/* Toggle Why */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowWhy((v) => !v)}
          className="mt-4 text-xs sm:text-sm text-blue-300 hover:text-blue-200"
        >
          {showWhy ? "Hide details" : "Why connect GitHub?"}
        </motion.button>

        <AnimatePresence>
          {showWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden mt-2 text-left text-gray-300 text-xs sm:text-sm bg-gray-800/60 border border-gray-700 rounded-lg p-2 sm:p-3"
            >
              - We only request minimal scopes to read your repos and write
              README when you ask. <br />
              - Private repos require the repo scope; you can revoke anytime in
              GitHub settings. <br />- Tokens are stored securely server-side
              and used only for your actions.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Rotating Quotes */}
      <div className="mt-10 h-12 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="text-gray-400 italic text-sm sm:text-base md:text-lg"
          >
            {quotes[quoteIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
