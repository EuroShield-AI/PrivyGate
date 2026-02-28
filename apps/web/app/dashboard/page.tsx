"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Globe, Shield, X, CheckCircle2, AlertCircle } from "lucide-react";

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
}

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

export default function Dashboard() {
  const [inputText, setInputText] = useState("");
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");
  const [processResult, setProcessResult] = useState<any>(null);
  const [gdprUrl, setGdprUrl] = useState("");
  const [gdprAnalysis, setGdprAnalysis] = useState<GDPRAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("wordprocessingml")) {
      alert("Only PDF and DOCX files are supported");
      return;
    }

    setUploadedFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setInputText(data.extractedText);
      alert(`File uploaded successfully! Extracted ${data.wordCount} words.`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRedact = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, retentionMode }),
      });
      if (!response.ok) throw new Error("Redaction failed");
      const data = await response.json();
      setRedactionResult(data);
      setProcessResult(null);
    } catch (error) {
      console.error("Redaction error:", error);
      alert("Failed to redact text");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!redactionResult) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: redactionResult.jobId, taskType }),
      });
      if (!response.ok) throw new Error("Processing failed");
      const data = await response.json();
      setProcessResult(data);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Failed to process text");
    } finally {
      setProcessing(false);
    }
  };

  const handleGDPRAnalysis = async () => {
    if (!gdprUrl.trim()) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/gdpr/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">PrivyGate Dashboard</h1>
          <div className="flex items-center gap-4">
            <a href="/api/swagger" className="text-sm text-slate-600 hover:text-slate-900">
              API Docs
            </a>
            <a href="/home" className="text-sm text-slate-600 hover:text-slate-900">
              Home
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="text" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text Processing</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="gdpr">GDPR Analyzer</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Redaction & Processing</CardTitle>
                <CardDescription>
                  Enter text to detect and redact PII, then process with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Input Text</Label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text containing personal information..."
                    className="min-h-[200px] mt-2"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Retention Mode</Label>
                    <Select value={retentionMode} onValueChange={(v: any) => setRetentionMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="zero">Zero-Retention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRedact} disabled={processing || !inputText.trim()}>
                    {processing ? "Processing..." : "Detect & Redact PII"}
                  </Button>
                </div>

                {redactionResult && (
                  <div className="space-y-4">
                    <div>
                      <Label>Detected Entities</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {redactionResult.entities && redactionResult.entities.length > 0 ? (
                          redactionResult.entities.map((entity, idx) => (
                            <Badge key={idx} variant="secondary">
                              {entity.type}: {entity.token} ({Math.round(entity.confidence * 100)}%)
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No entities detected</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Redacted Text</Label>
                      <Textarea
                        value={redactionResult.redactedText}
                        readOnly
                        className="min-h-[150px] mt-2 bg-slate-50"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>Processing Task</Label>
                        <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summarize">Summarize</SelectItem>
                            <SelectItem value="classify">Classify</SelectItem>
                            <SelectItem value="extract-actions">Extract Actions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleProcess} disabled={processing}>
                        {processing ? "Processing..." : "Process with AI"}
                      </Button>
                    </div>
                    {processResult && (
                      <div>
                        <Label>AI Result</Label>
                        <pre className="mt-2 p-4 bg-slate-50 rounded-md text-sm overflow-auto">
                          {JSON.stringify(processResult.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Drag & Drop File Upload</CardTitle>
                <CardDescription>
                  Upload PDF or DOCX files for processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium mb-2">
                    {uploadedFile ? uploadedFile.name : "Drag and drop your file here"}
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    or click to browse (PDF, DOCX)
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileInput}
                  />
                  <label htmlFor="file-upload">
                    <Button asChild variant="outline">
                      <span>Choose File</span>
                    </Button>
                  </label>
                  {uploading && <p className="mt-4 text-sm text-blue-600">Uploading...</p>}
                </div>
                {uploadedFile && (
                  <div className="mt-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setInputText("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gdpr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Website Analyzer</CardTitle>
                <CardDescription>
                  Analyze any website for GDPR compliance issues
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
