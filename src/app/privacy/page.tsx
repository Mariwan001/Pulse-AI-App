"use client";

import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, FileText, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
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
                <Shield className="w-5 h-5 text-blue-500" />
                <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
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
          
          {/* Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Eye className="w-6 h-6 text-blue-500" />
                <span>Privacy Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 leading-relaxed mb-4">
                At AI Assistant, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, process, and protect your data when you use our AI-powered platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                  <h4 className="text-white font-semibold mb-2">🔒 Data Protection</h4>
                  <p className="text-zinc-400 text-sm">Industry-standard security measures to protect your data</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                  <h4 className="text-white font-semibold mb-2">🤖 AI Transparency</h4>
                  <p className="text-zinc-400 text-sm">Clear information about how AI processes your data</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                  <h4 className="text-white font-semibold mb-2">👤 User Control</h4>
                  <p className="text-zinc-400 text-sm">Full control over your data with easy access and deletion</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                  <h4 className="text-white font-semibold mb-2">🌍 GDPR Compliant</h4>
                  <p className="text-zinc-400 text-sm">Compliant with international privacy regulations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Database className="w-6 h-6 text-green-500" />
                <span>Data Collection & Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">💬 Chat Messages & Conversations</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• All chat messages are stored securely for conversation continuity</li>
                  <li>• Message content is processed by AI services to provide responses</li>
                  <li>• Chat history is retained until you choose to delete it</li>
                  <li>• Messages are encrypted in transit and at rest</li>
                </ul>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">📄 PDF Documents & Files</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• PDF uploads are processed for content analysis and intelligence</li>
                  <li>• File content is temporarily stored for AI processing</li>
                  <li>• Original files are not permanently stored on our servers</li>
                  <li>• Processing data is deleted after analysis completion</li>
                </ul>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">⚙️ User Preferences & Settings</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Onboarding preferences and customizations</li>
                  <li>• Interface settings and theme preferences</li>
                  <li>• Feature usage patterns and preferences</li>
                  <li>• Session management and authentication data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* AI Processing */}
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-500" />
                <span>AI Processing & Third-Party Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">🤖 AI Service Providers</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• <strong>Groq AI:</strong> Primary AI processing for chat responses</li>
                  <li>• <strong>OpenAI:</strong> Additional AI capabilities and models</li>
                  <li>• <strong>Custom Models:</strong> Specialized processing for specific tasks</li>
                </ul>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">📊 Data Processing Details</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Your messages are sent to AI providers for processing</li>
                  <li>• AI providers may temporarily store data for service improvement</li>
                  <li>• We do not share personal information beyond what's necessary</li>
                  <li>• AI providers are bound by their own privacy policies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Users className="w-6 h-6 text-yellow-500" />
                <span>Your Rights & Control</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">📋 Right to Access</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Request a copy of all your personal data</li>
                  <li>• View your chat history and preferences</li>
                  <li>• Access your account settings and configurations</li>
                  <li>• Download your data in a portable format</li>
                </ul>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">🗑️ Right to Deletion</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Delete your account and all associated data</li>
                  <li>• Remove specific chat conversations</li>
                  <li>• Clear your preferences and settings</li>
                  <li>• Request permanent data erasure</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <Zap className="w-6 h-6 text-orange-500" />
                <span>Contact & Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">📧 Privacy Inquiries</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Email: mariwan.support.privacy.main@gmail.com</li>
                  <li>• Response time: Within 48 hours</li>
                  <li>• Data requests: Processed within 30 days</li>
                  <li>• Emergency: Immediate response for security issues</li>
                </ul>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                <h4 className="text-white font-semibold mb-3">🔧 Technical Support</h4>
                <ul className="text-zinc-300 text-sm space-y-2">
                  <li>• Email: mariwan.support.aiassistant.@gmail.com</li>
                  <li>• Response time: Within 24 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
} 