"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Zap, Shield } from "lucide-react";

import { CardSpotlight } from "@/components/ui/card-spotlight";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { GitHubStarsButton } from '@/components/ui/shadcn-io/github-stars-button';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 ">
        <GitHubStarsButton
          username="brooksolomon"
          repo="webmtp"
          onClick={(e) => e.preventDefault()}
          className="mb-8"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12 inline-flex items-center justify-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <EncryptedText text="WebMTP v1.0" className="p-3 m-2 text-xs font-medium tracking-wide uppercase text-white/70"/>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-12 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            Manage your Android
            <br />
            directly from the web.
          </h1>

          <p className="text-lg sm:text-xl text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed">
            The fastest way to transfer files between your Android device and your computer.
            No installation required. Secure, fast, and open source.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
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
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-5xl mx-auto"
        >
          <CardSpotlight className="h-64 flex flex-col justify-center items-center text-center p-6">
            <div className="mb-6">
              <Zap className="w-8 h-8 text-white/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold relative z-20 text-white mb-3">
              Lightning Fast
            </h3>
            <p className="text-neutral-400 relative z-20 text-sm leading-relaxed">
              Optimized MTP protocol for maximum transfer speeds with WebUSB technology.
            </p>
          </CardSpotlight>
          
          <CardSpotlight className="h-64 flex flex-col justify-center items-center text-center p-6">
            <div className="mb-6">
              <Shield className="w-8 h-8 text-white/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold relative z-20 text-white mb-3">
              Secure & Private
            </h3>
            <p className="text-neutral-400 relative z-20 text-sm leading-relaxed">
              Everything runs locally in your browser. Your data never leaves your device.
            </p>
          </CardSpotlight>
          
          <CardSpotlight className="h-64 flex flex-col justify-center items-center text-center p-6">
            <div className="mb-6">
              <Smartphone className="w-8 h-8 text-white/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold relative z-20 text-white mb-3">
              Universal Support
            </h3>
            <p className="text-neutral-400 relative z-20 text-sm leading-relaxed">
              Works with any Android device supporting MTP protocol via WebUSB.
            </p>
          </CardSpotlight>
        </motion.div>
      </main>

      <footer className="absolute bottom-6 w-full text-center text-white/20 text-sm">
        <p>© {new Date().getFullYear()} WebMTP. Built with Next.js & WebUSB.</p>
      </footer>
    </div>
  );
}


