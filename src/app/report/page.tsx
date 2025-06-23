"use client";

import Link from 'next/link';
import { useState, useRef } from 'react';
import { ArrowLeft, AlertTriangle, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// SVGs for Gmail and Instagram logos
const GmailLogo = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <rect width="48" height="48" rx="8" fill="#fff"/>
    <path d="M8 14.5V33.5C8 34.6046 8.89543 35.5 10 35.5H38C39.1046 35.5 40 34.6046 40 33.5V14.5C40 13.3954 39.1046 12.5 38 12.5H10C8.89543 12.5 8 13.3954 8 14.5Z" fill="#fff"/>
    <path d="M8 14.5L24 27.5L40 14.5" stroke="#EA4335" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M8 14.5V33.5C8 34.6046 8.89543 35.5 10 35.5H38C39.1046 35.5 40 34.6046 40 33.5V14.5" stroke="#EA4335" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M8 14.5L24 27.5L40 14.5" stroke="#34A853" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M8 14.5V33.5C8 34.6046 8.89543 35.5 10 35.5H38C39.1046 35.5 40 34.6046 40 33.5V14.5" stroke="#4285F4" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M8 14.5L24 27.5L40 14.5" stroke="#FBBC05" strokeWidth="2.5" strokeLinejoin="round"/>
  </svg>
);

const InstagramLogo = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <radialGradient id="ig-gradient" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stopColor="#fdf497"/>
      <stop offset="45%" stopColor="#fdf497"/>
      <stop offset="60%" stopColor="#fd5949"/>
      <stop offset="90%" stopColor="#d6249f"/>
      <stop offset="100%" stopColor="#285AEB"/>
    </radialGradient>
    <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#ig-gradient)"/>
    <circle cx="24" cy="24" r="9" stroke="#fff" strokeWidth="3"/>
    <circle cx="33.5" cy="14.5" r="2.5" fill="#fff"/>
  </svg>
);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ReportPage() {
  const [reportMessage, setReportMessage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const reportMessageRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(null);
    setReportError(null);
    if (!userInput.trim()) {
      setReportError('Email is required.');
      return;
    }
    if (!isValidEmail(userInput.trim())) {
      setReportError('Please enter a valid email address.');
      return;
    }
    setReportLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reportMessage, email: userInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReportSuccess("Thank you! Your report has been sent.");
        setReportMessage("");
        setUserInput("");
      } else {
        setReportError(data.error || "Failed to send report. Please try again later.");
      }
    } catch (err) {
      setReportError("Failed to send report. Please try again later.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-foreground">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-zinc-700" />
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h1 className="text-xl font-bold text-white">Report an Issue</h1>
              </div>
            </div>
            <div className="text-sm text-zinc-400">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <span>Something not right? Let us know.</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 leading-relaxed mb-4">
                If you found a bug, have feedback, or want to report something ironic, we appreciate your input.<br/>
                <span className="italic text-zinc-400">We take every report seriously—even the ironic ones.</span>
              </p>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {reportSuccess ? (
                  <div className="text-green-600 text-base font-medium mb-2 text-center">{reportSuccess}</div>
                ) : null}
                {reportError ? (
                  <div className="text-red-500 text-base font-medium mb-2 text-center">{reportError}</div>
                ) : null}
                <div className="mb-4 relative">
                  <label htmlFor="user-input" className="block text-base font-medium text-foreground mb-2">
                    Your Email Address<span className="text-xs text-zinc-400"> (required)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="user-input"
                      type="text"
                      className={`w-full rounded-lg border bg-background px-4 py-3 text-base text-foreground shadow-md focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all pr-16`}
                      placeholder="e.g. your@email.com"
                      autoComplete="email"
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      disabled={reportLoading}
                    />
                    {isValidEmail(userInput) && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-zinc-900 rounded-md px-4 py-1.5 font-semibold shadow-lg transition-all duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] opacity-100 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center gap-1 send-ironic-btn"
                        style={{
                          transition: 'opacity 400ms cubic-bezier(0.87,0,0.13,1), transform 400ms cubic-bezier(0.87,0,0.13,1)',
                          opacity: 1,
                          pointerEvents: reportLoading ? 'none' : 'auto',
                        }}
                        disabled={reportLoading}
                        onClick={handleSubmit}
                      >
                        <Send className="w-4 h-4 mr-1 -ml-1 send-ironic-icon" />
                        <span>Send</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="report-message" className="block text-base font-medium text-foreground mb-2">Your Report</label>
                  <textarea
                    id="report-message"
                    ref={reportMessageRef}
                    required
                    minLength={10}
                    maxLength={1000}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground shadow-md focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all min-h-[100px] resize-none"
                    placeholder="Describe your issue, feedback, or concern..."
                    value={reportMessage}
                    onChange={e => setReportMessage(e.target.value)}
                    disabled={reportLoading}
                  />
                </div>
              </form>
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50 mt-8">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  How to get a quick response
                </h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Be clear and concise in your message</li>
                  <li>• We usually respond within 24-48 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <style jsx global>{`
        .send-ironic-btn {
          box-shadow: 0 2px 16px 0 rgba(80,80,80,0.10);
          font-family: inherit;
          font-weight: 600;
          letter-spacing: 0.01em;
          will-change: transform, box-shadow;
        }
        .send-ironic-btn:hover .send-ironic-icon {
          animation: send-wiggle 0.5s cubic-bezier(0.87,0,0.13,1);
        }
        @keyframes send-wiggle {
          0% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-12deg) scale(1.08); }
          40% { transform: rotate(10deg) scale(1.12); }
          60% { transform: rotate(-8deg) scale(1.08); }
          80% { transform: rotate(6deg) scale(1.04); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
} 