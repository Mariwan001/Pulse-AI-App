"use client";

import * as React from "react";
import Link from "next/link";
import { Github, Instagram, Twitter, Linkedin, Mail, Heart, ArrowUpRight, BrainCircuit } from "lucide-react";
import { useState, useRef } from "react";

export function Footer() {
  const [isInstagramHovered, setIsInstagramHovered] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [instaUsername, setInstaUsername] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const reportMessageRef = useRef<HTMLTextAreaElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/50 to-black/80 backdrop-blur-sm">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-600/50 to-transparent" />
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8 md:py-12 transition-all">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 overflow-x-auto min-w-0 transition-all">
          {/* Brand section */}
          <div className="space-y-4 min-w-0 break-words max-w-full">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all">
                <BrainCircuit className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent truncate max-w-[120px] sm:max-w-none">
                AI Assistant
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs break-words">
              Your intelligent companion for homework, research, and creative tasks. 
              Powered by cutting-edge AI technology.
            </p>
            <div className="flex flex-wrap items-center space-x-1 text-zinc-500 text-xs">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>by</span>
              <Link 
                href="https://second-advanced-port.vercel.app/" 
                target="_blank"
                className="text-zinc-400 hover:text-white transition-colors duration-200 hover:underline"
              >
                Mariwan
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 min-w-0 break-words max-w-full">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span>Start Chat</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span>About</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span>Features</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm flex items-center group w-full text-left">
                  <span>Report</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4 min-w-0 break-words max-w-full">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Features
            </h3>
            <ul className="space-y-2">
              <li className="text-zinc-400 text-sm">PDF Intelligence</li>
              <li className="text-zinc-400 text-sm">Academic Validation</li>
              <li className="text-zinc-400 text-sm">Global Time Zones</li>
              <li className="text-zinc-400 text-sm">Smart Summarization</li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4 min-w-0 break-words max-w-full">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Connect
            </h3>
            <div className="space-y-3">
              <Link 
                href="mailto:contact@example.com"
                className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200 text-sm group"
              >
                <Mail className="w-4 h-4" />
                <span>Get in touch</span>
              </Link>
              
              <div className="flex space-x-3 pt-2">
                <Link 
                  href="https://github.com/mariwan001" 
                  target="_blank" 
                  className="group relative flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 text-zinc-400 hover:text-white transition-all duration-300 ease-out cursor-pointer border border-zinc-600/30 hover:border-zinc-500/60 rounded-lg hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <Github className="h-6 w-6 sm:h-5 sm:w-5" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-zinc-600/20 to-zinc-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link 
                  href="https://instagram.com/mariwan_tech" 
                  target="_blank" 
                  onMouseEnter={() => setIsInstagramHovered(true)}
                  onMouseLeave={() => setIsInstagramHovered(false)}
                  className="group relative flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 text-zinc-400 hover:text-white transition-all duration-300 ease-out cursor-pointer border border-zinc-600/30 hover:border-zinc-500/60 rounded-lg hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Instagram className="h-6 w-6 sm:h-5 sm:w-5" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-zinc-800/50 pt-8 mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 w-full transition-all">
            <div className="flex flex-wrap items-center justify-center space-x-2 md:space-x-4 text-sm text-zinc-500 w-full md:w-auto text-center">
              <span className="whitespace-nowrap">© 2025 Mariwan. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="inline md:hidden">|</span>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors whitespace-nowrap">
                Privacy Policy
              </Link>
              <span className="hidden md:inline">•</span>
              <span className="inline md:hidden">|</span>
              <Link href="/terms" className="hover:text-zinc-400 transition-colors whitespace-nowrap">
                Terms of Service
              </Link>
            </div>
            
            <button
              onClick={scrollToTop}
              className="group flex items-center space-x-2 text-zinc-400 hover:text-white transition-all duration-300 ease-out cursor-pointer border border-zinc-600/30 hover:border-zinc-500/60 rounded-lg px-4 py-2 hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <span className="text-sm">Back to top</span>
              <ArrowUpRight className="w-4 h-4 rotate-[-45deg] group-hover:translate-y-[-2px] transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md mx-2 animate-fadeInUp relative">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl font-bold focus:outline-none"
              onClick={() => {
                setShowReportModal(false);
                setReportMessage("");
                setInstaUsername("");
                setReportSuccess(null);
                setReportError(null);
              }}
              aria-label="Close report modal"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-2 text-foreground">Submit a Report</h2>
            <div className="text-zinc-400 text-sm mb-4">Let us know your issue, feedback, or concern. Your report will be sent privately to the admin.</div>
            {reportSuccess ? (
              <div className="text-green-600 text-sm font-medium mb-2">{reportSuccess}</div>
            ) : null}
            {reportError ? (
              <div className="text-red-500 text-sm font-medium mb-2">{reportError}</div>
            ) : null}
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setReportLoading(true);
                setReportSuccess(null);
                setReportError(null);
                try {
                  const res = await fetch("/api/report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: reportMessage, instaUsername }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    setReportSuccess("Thank you! Your report has been sent.");
                    setReportMessage("");
                    setInstaUsername("");
                    setTimeout(() => setShowReportModal(false), 1800);
                  } else {
                    setReportError(data.error || "Failed to send report. Please try again later.");
                  }
                } catch (err) {
                  setReportError("Failed to send report. Please try again later.");
                } finally {
                  setReportLoading(false);
                }
              }}
            >
              <div>
                <label htmlFor="report-message" className="block text-sm font-medium text-foreground mb-1">Your Report</label>
                <textarea
                  id="report-message"
                  ref={reportMessageRef}
                  required
                  minLength={10}
                  maxLength={1000}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all min-h-[80px] resize-none"
                  placeholder="Describe your issue, feedback, or concern..."
                  value={reportMessage}
                  onChange={e => setReportMessage(e.target.value)}
                  disabled={reportLoading}
                />
              </div>
              <div>
                <label htmlFor="insta-username" className="block text-sm font-medium text-foreground mb-1">Instagram Username <span className="text-xs text-zinc-400">(optional, helps us find your request)</span></label>
                <input
                  id="insta-username"
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                  placeholder="e.g. your_insta_username"
                  autoComplete="username"
                  value={instaUsername}
                  onChange={e => setInstaUsername(e.target.value)}
                  disabled={reportLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:bg-primary/90 transition-all shadow-md disabled:opacity-60"
                disabled={reportLoading || reportMessage.length < 10}
              >
                {reportLoading ? "Sending..." : "Send Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
