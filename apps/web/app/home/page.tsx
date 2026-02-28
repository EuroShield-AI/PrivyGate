"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, FileCheck, Zap, Globe, ArrowRight, CheckCircle2, FileText, Search, Database, Code, BarChart3 } from "lucide-react";
import Link from "next/link";
import { OTPInput } from "@/components/otp-input";
import { Notification } from "@/components/notification";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Optionally redirect to dashboard
      // router.push("/dashboard");
    }
  }, [router]);

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string) => {
    setNotification({ type, message });
  };

  const handleSendOTP = async () => {
    if (!email) {
      showNotification("warning", "Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        showNotification("success", "OTP sent successfully! Please check your email.");
      } else {
        // Email sending failed but OTP is available
        if (data.code) {
          showNotification("info", `OTP: ${data.code} (Email sending failed, using code for testing)`);
          setOtpSent(true);
        } else {
          showNotification("error", data.error || "Failed to send OTP. Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
      showNotification("error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showNotification("warning", "Please enter a complete 6-digit OTP code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
        showNotification("success", "Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        showNotification("error", data.error || "Invalid OTP. Please try again.");
        setOtp(""); // Clear OTP input
      }
    } catch (error) {
      console.error(error);
      showNotification("error", "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {notification && (
        <div className="fixed top-20 right-4 z-50 w-96">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">PrivyGate</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/api/swagger" className="text-sm text-slate-600 hover:text-slate-900">
              API Docs
            </Link>
            {isLoggedIn && (
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            Privacy-by-Design AI Infrastructure
            <br />
            <span className="text-blue-600">for European Organizations</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Safely adopt LLM workflows without exposing personal data or violating GDPR principles. 
            PrivyGate acts as a secure privacy layer between your sensitive data and AI systems.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
              GDPR Compliant
            </div>
            <div className="px-3 py-1.5 bg-blue-50 rounded-full text-sm font-medium text-blue-700">
              AI-Powered Processing
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
              Complete Audit Trails
            </div>
          </div>
          
          {/* Login Card */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Sign in with your email</CardDescription>
            </CardHeader>
            <CardContent>
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSendOTP} disabled={loading} className="w-full">
                    Send Login Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="otp" className="block text-center">Enter 6-digit code</Label>
                    <div className="mt-2">
                      <OTPInput
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Check your email for the verification code
                    </p>
                  </div>
                  <Button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6} className="w-full">
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }} className="w-full text-sm">
                    Use different email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-slate-900">Core Features</h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Everything you need to process sensitive data safely with AI while maintaining full GDPR compliance
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border hover:border-blue-500 transition-colors">
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mb-3" />
                <CardTitle className="text-lg">Text Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-3 text-sm leading-relaxed">
                  Detect and redact PII from text using rule-based and AI-powered detection. 
                  Process redacted content with Mistral AI for summarization, classification, and action extraction.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <li>• Automatic PII detection (emails, phones, IBANs, names)</li>
                  <li>• Reversible pseudonymization</li>
                  <li>• AI processing with 12+ Mistral models</li>
                  <li>• Structured JSON outputs</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:border-blue-500 transition-colors">
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-3" />
                <CardTitle className="text-lg">File Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-3 text-sm leading-relaxed">
                  Upload PDF and DOCX files for automatic text extraction and processing. 
                  Large files are automatically chunked and stored in vector database for efficient AI processing.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <li>• PDF and DOCX support</li>
                  <li>• Automatic chunking for large files</li>
                  <li>• Vector database integration (ChromaDB)</li>
                  <li>• Semantic search capabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:border-blue-500 transition-colors">
              <CardHeader>
                <Globe className="h-8 w-8 text-blue-600 mb-3" />
                <CardTitle className="text-lg">GDPR Website Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-3 text-sm leading-relaxed">
                  Automated website scanning for GDPR compliance. Detects cookies, privacy policies, 
                  consent mechanisms, and provides AI-powered compliance scoring.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <li>• Automated website crawling</li>
                  <li>• Cookie and consent detection</li>
                  <li>• Privacy policy verification</li>
                  <li>• AI-powered compliance analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why PrivyGate Section */}
      <section className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3 text-slate-900">Why PrivyGate?</h2>
            <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              European organizations face a major blocker when adopting AI: How can we use LLMs without exposing personal data or violating GDPR principles?
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle className="text-lg">GDPR-First Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Built from the ground up with privacy-by-design principles. Every feature enforces 
                    data minimization, pseudonymization, and complete auditability for regulatory compliance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle className="text-lg">Model Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Choose from 12+ Mistral AI models including Mistral Large 3, Ministral variants, 
                    Magistral reasoning models, and Pixtral for multimodal processing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Code className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle className="text-lg">API-First Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    RESTful API with full OpenAPI/Swagger documentation. Designed for integration with 
                    ERP, CRM, helpdesk systems, and internal tooling. OAuth2 authentication support.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle className="text-lg">Complete Audit Trails</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Every operation is logged with full context. Export RoPA-compatible CSV reports 
                    for compliance documentation. Track token usage and processing history.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Details */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3 text-slate-900">Security & Compliance</h2>
            <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Enterprise-grade security with GDPR compliance built into every feature
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">Data Minimization</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Only process the minimum data necessary for your use case. 
                    Automatic detection and redaction of unnecessary PII before AI processing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">Reversible Pseudonymization</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Replace sensitive data with tokens (EMAIL_1, PHONE_2) that can be reversed when needed, 
                    maintaining data utility while protecting privacy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">AES-256-GCM Encryption</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    All sensitive data encrypted at rest. User API keys stored encrypted in database. 
                    Secure vault for pseudonymization mappings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">Complete Audit Trails</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Every action logged with full context. Export RoPA-compatible CSV reports 
                    for compliance documentation. Track all processing operations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">Zero-Retention Mode</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Optional mode where sensitive data is never stored, 
                    processed in-memory only for maximum privacy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1.5 text-slate-900">User-Specific API Keys</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Each user can configure their own Mistral API key, stored encrypted. 
                    Test connection before saving. Full control over AI model selection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Importance Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-600 rounded-lg p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">Why This Matters</h2>
            <p className="text-base md:text-lg mb-5 text-white/90 leading-relaxed">
              European organizations are increasingly adopting AI, but face significant challenges:
            </p>
            <ul className="space-y-2.5 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm leading-relaxed"><strong>GDPR Compliance:</strong> Processing personal data with AI requires strict compliance with data protection regulations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm leading-relaxed"><strong>Data Minimization:</strong> Only necessary data should be processed, requiring automatic PII detection and redaction</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm leading-relaxed"><strong>Auditability:</strong> Complete audit trails are essential for demonstrating compliance to regulators</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm leading-relaxed"><strong>Privacy-by-Design:</strong> Privacy must be built into the system architecture, not added as an afterthought</span>
              </li>
            </ul>
            <p className="text-base font-medium mb-5 leading-relaxed">
              PrivyGate solves these challenges by providing a privacy-first gateway that enables safe AI adoption while maintaining full compliance.
            </p>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <p className="text-white/80 text-sm">
                Sign in above to access the dashboard and start processing data securely
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center text-slate-600 text-sm">
          <p>&copy; 2026 PrivyGate. Built for privacy and compliance.</p>
        </div>
      </footer>
    </div>
  );
}
