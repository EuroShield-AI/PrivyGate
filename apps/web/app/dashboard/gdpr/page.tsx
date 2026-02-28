"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface GDPRAnalysis {
  url: string;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation?: string;
  }>;
  score: number;
  hasPrivacyPolicy: boolean;
  hasCookieBanner: boolean;
  dataCollectionPoints: number;
}

export default function GDPRAnalyzerPage() {
  const [gdprUrl, setGdprUrl] = useState("");
  const [gdprAnalysis, setGdprAnalysis] = useState<GDPRAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleGDPRAnalysis = async () => {
    if (!gdprUrl.trim()) return;
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/gdpr/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: gdprUrl }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setGdprAnalysis(data);
    } catch (error) {
      console.error("GDPR analysis error:", error);
      alert("Failed to analyze website");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "GDPR Analyzer" }]} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">GDPR Website Analyzer</h1>
          <p className="text-slate-600 mt-2">
            Analyze any website for GDPR compliance issues
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
                />
                <Button onClick={handleGDPRAnalysis} disabled={analyzing || !gdprUrl.trim()}>
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>

            {gdprAnalysis && (
              <div className="space-y-4 mt-6">
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
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            ) : finding.severity === "medium" ? (
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
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
    </>
  );
}
