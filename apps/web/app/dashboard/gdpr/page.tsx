"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, X, Loader2, Globe } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notification } from "@/components/notification";
import { APIExamples } from "@/components/api-examples";

interface GDPRAnalysis {
  url: string;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation?: string;
    aiAnalysis?: string;
  }>;
  score: number;
  hasPrivacyPolicy: boolean;
  hasCookieBanner: boolean;
  dataCollectionPoints: number;
  aiSummary?: string;
  scanningStatus?: string;
}

export default function GDPRAnalyzerPage() {
  const [gdprUrl, setGdprUrl] = useState("");
  const [gdprAnalysis, setGdprAnalysis] = useState<GDPRAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string) => {
    setNotification({ type, message });
  };

  const handleGDPRAnalysis = async () => {
    if (!gdprUrl.trim()) {
      showNotification("warning", "Please enter a website URL");
      return;
    }
    setAnalyzing(true);
    setScanningStatus("Initializing scan...");
    setGdprAnalysis(null);
    
    try {
      const token = localStorage.getItem("token");
      
      // Simulate status updates during analysis
      const statusInterval = setInterval(() => {
        const statuses = [
          "Fetching website content...",
          "Parsing HTML structure...",
          "Detecting privacy elements...",
          "Analyzing compliance...",
          "Running AI analysis...",
        ];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        setScanningStatus(randomStatus);
      }, 1000);

      const response = await fetch("/api/gdpr/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: gdprUrl }),
      });

      clearInterval(statusInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }
      
      const data = await response.json();
      setGdprAnalysis(data);
      showNotification("success", `Analysis complete! Compliance score: ${data.score}/100`);
    } catch (error) {
      console.error("GDPR analysis error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to analyze website");
    } finally {
      setAnalyzing(false);
      setScanningStatus("");
    }
  };

  const apiExamples = [
    {
      endpoint: "/api/gdpr/analyze",
      method: "POST",
      description: "Analyze a website for GDPR compliance with AI enhancement",
      curl: `curl -X POST https://api.privygate.com/api/gdpr/analyze \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com"
  }'`,
      sampleResponse: {
        url: "https://example.com",
        score: 75,
        hasPrivacyPolicy: true,
        hasCookieBanner: false,
        dataCollectionPoints: 3,
        findings: [
          {
            type: "consent",
            severity: "high",
            description: "No cookie consent banner detected",
            recommendation: "Implement a GDPR-compliant cookie consent mechanism"
          }
        ],
        aiSummary: "The website has a privacy policy but lacks proper consent mechanisms..."
      }
    }
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "GDPR Analyzer" }]} />
      
      {notification && (
        <div className="fixed top-20 right-4 z-50 w-96">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-6 overflow-y-auto">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">GDPR Website Analyzer</h1>
            <p className="text-slate-600 mt-2">
              Automatically scan and analyze websites for GDPR compliance issues. 
              Uses AI-powered analysis to detect privacy policy gaps, consent mechanisms, and data collection practices.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Website Analysis</CardTitle>
              <CardDescription>
                Enter a website URL to analyze for GDPR compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={gdprUrl}
                    onChange={(e) => setGdprUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                    disabled={analyzing}
                  />
                  <Button onClick={handleGDPRAnalysis} disabled={analyzing || !gdprUrl.trim()}>
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {analyzing && scanningStatus && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Scanning Website</p>
                        <p className="text-xs text-blue-700">{scanningStatus}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gdprAnalysis && (
                <div className="space-y-4 mt-6">
                  {gdprAnalysis.aiSummary && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg">AI Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{gdprAnalysis.aiSummary}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-600">Compliance Score</p>
                      <p className="text-3xl font-bold">
                        {gdprAnalysis.score}
                        <span className="text-lg text-slate-500">/100</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {gdprAnalysis.score >= 80 ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      ) : gdprAnalysis.score >= 60 ? (
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          {gdprAnalysis.hasPrivacyPolicy ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium">Privacy Policy</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          {gdprAnalysis.hasCookieBanner ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium">Cookie Banner</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{gdprAnalysis.dataCollectionPoints}</p>
                          <p className="text-sm text-slate-600">Data Collection Points</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Label>Findings</Label>
                    <div className="space-y-2 mt-2">
                      {gdprAnalysis.findings.map((finding, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              {finding.severity === "high" ? (
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              ) : finding.severity === "medium" ? (
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={finding.severity === "high" ? "destructive" : "secondary"}>
                                    {finding.severity}
                                  </Badge>
                                  <span className="text-sm font-medium">{finding.type}</span>
                                </div>
                                <p className="text-sm text-slate-600">{finding.description}</p>
                                {finding.recommendation && (
                                  <p className="text-sm text-blue-600 mt-1">
                                    💡 {finding.recommendation}
                                  </p>
                                )}
                                {finding.aiAnalysis && (
                                  <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                    <p className="text-xs font-medium text-purple-900 mb-1">AI Insight:</p>
                                    <p className="text-xs text-purple-700">{finding.aiAnalysis}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 h-full">
          <APIExamples examples={apiExamples} />
        </div>
      </div>
    </>
  );
}
