"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 inline-flex items-center justify-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <span className="px-3 py-1 text-xs font-medium tracking-wide uppercase text-white/70">
              WebMTP v1.0
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            Manage your Android
            <br />
            directly from the web.
          </h1>

          <p className="text-lg sm:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            The fastest way to transfer files between your Android device and your computer.
            No installation required. Secure, fast, and open source.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg flex items-center gap-2 overflow-hidden"
              >
                <span className="relative z-10">Launch App</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </Link>

            <Link href="https://github.com/brooksolomon/webmtp" target="_blank">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                View on GitHub
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-yellow-400" />}
            title="Lightning Fast"
            description="Optimized MTP protocol for maximum transfer speeds."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-green-400" />}
            title="Secure & Private"
            description="Everything runs locally in your browser. No data leaves your device."
          />
          <FeatureCard
            icon={<Smartphone className="w-6 h-6 text-blue-400" />}
            title="Universal Support"
            description="Works with any Android device supporting MTP or ADB."
          />
        </motion.div>
      </main>

      <footer className="absolute bottom-6 w-full text-center text-white/20 text-sm">
        <p>© {new Date().getFullYear()} WebMTP. Built with Next.js & WebUSB.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white/90">{title}</h3>
      <p className="text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}
