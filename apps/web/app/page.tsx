"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
  fileInfo?: {
    filename: string;
    wordCount: number;
  };
}

interface ProcessResult {
  jobId: string;
  taskType: string;
  result: unknown;
}

interface FileUploadResult {
  fileId: string;
  filename: string;
  extractedText: string;
  wordCount: number;
  pageCount?: number;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");

  const handleRedact = async () => {
    if (!inputText.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, retentionMode }),
      });

      if (!response.ok) {
        throw new Error("Redaction failed");
      }

      const data = await response.json();
      setRedactionResult(data);
      setProcessResult(null);
    } catch (error) {
      console.error("Redaction error:", error);
      alert("Failed to redact text. Please try again.");
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
        body: JSON.stringify({
          jobId: redactionResult.jobId,
          taskType,
        }),
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const data = await response.json();
      setProcessResult(data);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Failed to process text. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file");
      return;
    }

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
      setUploadedFile(data);
      setInputText(data.extractedText);
      setRedactionResult(null);
      setProcessResult(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRedactFile = async () => {
    if (!uploadedFile) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/redact-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploadedFile.fileId,
          retentionMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Redaction failed");
      }

      const data = await response.json();
      setRedactionResult(data);
      setProcessResult(null);
    } catch (error) {
      console.error("File redaction error:", error);
      alert("Failed to redact file. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleExportRoPA = async () => {
    try {
      const response = await fetch("/api/export/ropa");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ropa-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export RoPA data.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-slate-900">PrivyGate</h1>
          <p className="text-slate-600">Privacy-by-Design AI Infrastructure for Europe</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Method</CardTitle>
            <CardDescription>Choose how to provide content for processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "text" ? "default" : "outline"}
                onClick={() => setActiveTab("text")}
              >
                Text Input
              </Button>
              <Button
                variant={activeTab === "file" ? "default" : "outline"}
                onClick={() => setActiveTab("file")}
              >
                File Upload (PDF/DOCX)
              </Button>
            </div>

            {activeTab === "file" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Document</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-slate-500">
                    Supported formats: PDF, DOCX (Max 50MB)
                  </p>
                </div>
                {uploadedFile && (
                  <div className="p-3 bg-slate-50 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{uploadedFile.filename}</p>
                        <p className="text-sm text-slate-500">
                          {uploadedFile.wordCount} words
                          {uploadedFile.pageCount && ` • ${uploadedFile.pageCount} pages`}
                        </p>
                      </div>
                      <Badge variant="secondary">Extracted</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{activeTab === "file" ? "File Content" : "Input Text"}</CardTitle>
              <CardDescription>
                {activeTab === "file"
                  ? "Extracted text from uploaded file"
                  : "Enter text containing personal data to be redacted"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Text Content</Label>
                <Textarea
                  id="text"
                  placeholder="Enter text with personal information (emails, names, phone numbers, etc.)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retention">Retention Mode</Label>
                <Select
                  value={retentionMode}
                  onValueChange={(value) => setRetentionMode(value as "standard" | "zero")}
                >
                  <SelectTrigger id="retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Retention</SelectItem>
                    <SelectItem value="zero">Zero Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={activeTab === "file" ? handleRedactFile : handleRedact}
                disabled={processing || uploading || (!inputText.trim() && !uploadedFile)}
                className="w-full"
              >
                {processing
                  ? "Processing..."
                  : uploading
                  ? "Uploading..."
                  : "Detect & Redact PII"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redacted Output</CardTitle>
              <CardDescription>
                Personal data has been replaced with tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {redactionResult ? (
                <>
                  <div className="space-y-2">
                    <Label>Redacted Text</Label>
                    <div className="p-3 bg-slate-50 rounded-md border font-mono text-sm min-h-[200px] max-h-[300px] overflow-y-auto">
                      {redactionResult.redactedText}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Detected Entities</Label>
                    <div className="flex flex-wrap gap-2">
                      {redactionResult.entities.map((entity, idx) => (
                        <Badge key={idx} variant="secondary">
                          {entity.type}: {entity.token} ({Math.round(entity.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Job ID: {redactionResult.jobId}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  Redacted text will appear here after processing
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {redactionResult && (
          <Card>
            <CardHeader>
              <CardTitle>AI Processing</CardTitle>
              <CardDescription>
                Process redacted text with Mistral AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="task">Task Type</Label>
                  <Select
                    value={taskType}
                    onValueChange={(value) => setTaskType(value as typeof taskType)}
                  >
                    <SelectTrigger id="task">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summarize">Summarize</SelectItem>
                      <SelectItem value="classify">Classify</SelectItem>
                      <SelectItem value="extract-actions">Extract Actions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleProcess}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Process with AI"}
                  </Button>
                </div>
              </div>
              {processResult && (
                <div className="space-y-2">
                  <Label>Result</Label>
                  <div className="p-3 bg-slate-50 rounded-md border font-mono text-sm max-h-[300px] overflow-y-auto">
                    <pre>{JSON.stringify(processResult.result, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Compliance & Audit</CardTitle>
            <CardDescription>
              Export audit logs for compliance documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportRoPA} variant="outline" className="w-full">
              Export RoPA (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
