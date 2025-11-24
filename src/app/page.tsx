"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowRight, Smartphone, Zap, Shield } from "lucide-react";

import { CardSpotlight } from "@/components/ui/card-spotlight";
const EncryptedText = dynamic(() => import("@/components/ui/encrypted-text").then(mod => ({ default: mod.EncryptedText })), {
  ssr: false,
});
import { GitHubStarsButton } from '@/components/ui/shadcn-io/github-stars-button';


export default function LandingPage() { 
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
      <div className="fixed inset-0 z-0 bg-black"></div>
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-8 py-4 flex justify-between items-center w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform hover:scale-110 overflow-hidden">
            <img src="/logo.png" alt="WebMTP" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            WebMTP
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="https://github.com/brooksolomon/webmtp" 
            target="_blank"
            className="px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </span>
          </Link>
          <Link 
            href="/app"
            className="px-5 py-2 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/30 shadow-lg shadow-white/10"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-24">
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
            Android File Transfer
            <br />
            for macOS
          </h1>

          <p className="text-lg sm:text-xl text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed">
            The best way to manage files between your Android device and Mac.
            Native MTP support, no installation required. Secure, fast, and open source.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-5 bg-gradient-to-r from-white via-white to-gray-100 text-black rounded-2xl font-bold text-lg flex items-center gap-3 overflow-hidden transition-all duration-300 shadow-2xl shadow-white/20 hover:shadow-white/40"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                
                {/* Sliding shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                
                {/* Button content */}
                <span className="relative z-10 font-semibold tracking-wide">Launch App</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
                
                {/* Particle effects */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2">
                  <div className="w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping" />
                </div>
                <div className="absolute top-1/2 right-8 -translate-y-1/2">
                  <div className="w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-200" />
                </div>
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
          
          <CardSpotlight className="h-64 flex flex-col justify-center items-center text-center p-6 ">
            <div className="mb-6">
              <Shield className="w-8 h-8 text-white/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold relative z-20 text-white mb-3">
              Secure & Private
            </h3>
            <p className="text-neutral-400 relative z-20 text-sm leading-relaxed m-2 p-2">
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
            <p className="text-neutral-400 relative z-20 text-sm leading-relaxed m-2 p-2">
              Works with any Android device supporting MTP protocol via WebUSB.
            </p>
          </CardSpotlight>
        </motion.div>
      </main>

      <footer className="w-full py-6 text-center text-white/20 text-sm relative z-10">
        <p>© {new Date().getFullYear()} WebMTP. Built with Next.js & WebUSB.</p>
      </footer>
    </div>
  );
}


