"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, FileCheck, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Privacy-First Data Processing
            <br />
            <span className="text-blue-600">GDPR Compliant by Design</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Process sensitive data with AI while maintaining full compliance. 
            Automatic PII detection, reversible pseudonymization, and complete audit trails.
          </p>
          
          {/* Login Card */}
          <Card className="max-w-md mx-auto mb-12">
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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why PrivyGate?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Built-in compliance features including data minimization, 
                  pseudonymization, and complete audit trails for regulatory requirements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  AES-256 encryption at rest, reversible pseudonymization vault, 
                  and zero-retention mode for maximum data protection.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Leverage Mistral AI for intelligent processing while keeping 
                  sensitive data protected through automatic redaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Details */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Security & Compliance</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Data Minimization</h3>
                  <p className="text-slate-600">
                    Only process the minimum data necessary for your use case. 
                    Automatic detection and redaction of unnecessary PII.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Reversible Pseudonymization</h3>
                  <p className="text-slate-600">
                    Replace sensitive data with tokens that can be reversed when needed, 
                    maintaining data utility while protecting privacy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Complete Audit Trails</h3>
                  <p className="text-slate-600">
                    Every action is logged with full context. Export RoPA-compatible 
                    reports for compliance documentation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Zero-Retention Mode</h3>
                  <p className="text-slate-600">
                    Optional mode where sensitive data is never stored, 
                    processed in-memory only for maximum privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-white/80">
              Start processing data securely today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-slate-100">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <p className="text-center text-slate-500">
                Sign in to access the dashboard
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2026 PrivyGate. Built for privacy and compliance.</p>
        </div>
      </footer>
    </div>
  );
}
