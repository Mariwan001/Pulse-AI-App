"use client";

import Link from 'next/link';
import { ArrowLeft, Scale, Zap, Users, Brain, AlertTriangle, CheckCircle, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-foreground">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white transition-all duration-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-zinc-700" />
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Scale className="w-6 h-6 text-zinc-300" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  v2.0
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Service Overview */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                <Globe className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Service Overview</h2>
                <p className="text-zinc-400">Understanding our AI-powered platform capabilities and scope</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-300">
                <h3 className="text-zinc-200 font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  What We Provide
                </h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Intelligent AI chat assistance</li>
                  <li>• PDF document analysis & intelligence</li>
                  <li>• Academic validation & homework help</li>
                  <li>• Global time zone calculations</li>
                  <li>• Smart text summarization</li>
                  <li>• Content simplification tools</li>
                </ul>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-300">
                <h3 className="text-zinc-200 font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Service Limitations
                </h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Not a substitute for professional advice</li>
                  <li>• Educational use recommended</li>
                  <li>• No medical or legal counsel</li>
                  <li>• Accuracy not guaranteed</li>
                  <li>• Subject to availability</li>
                  <li>• Usage limits may apply</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acceptable Use */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                <Users className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Acceptable Use Policy</h2>
                <p className="text-zinc-400">Guidelines for responsible and ethical platform usage</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Permitted Activities
                </h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Educational research and homework assistance</li>
                  <li>• Document analysis and content understanding</li>
                  <li>• Time zone calculations and scheduling</li>
                  <li>• Content summarization for learning</li>
                  <li>• General knowledge inquiries</li>
                  <li>• Creative writing and brainstorming</li>
                </ul>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Prohibited Activities
                </h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Illegal activities or content</li>
                  <li>• Harassment, hate speech, or bullying</li>
                  <li>• Academic dishonesty or cheating</li>
                  <li>• Copyright infringement</li>
                  <li>• Malicious code or security attacks</li>
                  <li>• Spam or automated abuse</li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Limitations */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                <Brain className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Limitations & Disclaimers</h2>
                <p className="text-zinc-400">Understanding AI capabilities, constraints, and important disclaimers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4">AI Capabilities</h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Advanced language processing</li>
                  <li>• Document analysis & extraction</li>
                  <li>• Mathematical calculations</li>
                  <li>• Creative content generation</li>
                  <li>• Pattern recognition</li>
                  <li>• Contextual understanding</li>
                </ul>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4">Important Disclaimers</h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• AI responses may contain errors</li>
                  <li>• Not a substitute for professional advice</li>
                  <li>• Verify information independently</li>
                  <li>• No guarantee of accuracy</li>
                  <li>• Use at your own discretion</li>
                  <li>• Educational purposes recommended</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
              <h3 className="text-zinc-200 font-semibold mb-4">Academic Use Guidelines</h3>
              <p className="text-zinc-300 text-sm mb-4">
                When using our AI for academic purposes, please follow these guidelines:
              </p>
              <ul className="text-zinc-300 space-y-2 text-sm">
                <li>• Use AI as a learning tool, not for cheating</li>
                <li>• Verify all information independently</li>
                <li>• Cite sources when appropriate</li>
                <li>• Follow your institution's policies</li>
                <li>• Use for understanding, not copying</li>
              </ul>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                <Zap className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Contact & Support</h2>
                <p className="text-zinc-400">Get help and reach our support team</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4">Legal Inquiries</h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Terms of Service questions</li>
                  <li>• Legal compliance issues</li>
                  <li>• Copyright concerns</li>
                  <li>• Privacy policy inquiries</li>
                  <li className="flex items-center space-x-2 mt-4">
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-200 font-medium">mariwan.support.privacy.main@gmail.com</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                <h3 className="text-zinc-200 font-semibold mb-4">Technical Support</h3>
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li>• Platform issues</li>
                  <li>• Feature questions</li>
                  <li>• Account problems</li>
                  <li>• Bug reports</li>
                  <li className="flex items-center space-x-2 mt-4">
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-200 font-medium">mariwan.support.aiassistant.@gmail.com</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
              <h3 className="text-zinc-200 font-semibold mb-4">Response Times</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-zinc-300">
                  <div className="font-semibold text-zinc-200">Legal Inquiries</div>
                  <div className="text-zinc-400">Within 48 hours</div>
                </div>
                <div className="text-zinc-300">
                  <div className="font-semibold text-zinc-200">Technical Support</div>
                  <div className="text-zinc-400">Within 24 hours</div>
                </div>
                <div className="text-zinc-300">
                  <div className="font-semibold text-zinc-200">Urgent Issues</div>
                  <div className="text-zinc-400">Immediate response</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 