"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Shield, Zap, Eye, EyeOff } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notification } from "@/components/notification";
import { APIUsageModal } from "@/components/api-usage-modal";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code2 } from "lucide-react";

interface FileUploadResult {
  fileId: string;
  filename: string;
  extractedText: string;
  wordCount: number;
  pageCount: number;
}

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
  fileInfo: {
    filename: string;
    wordCount: number;
  };
}

export default function FilesPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileResult, setFileResult] = useState<FileUploadResult | null>(null);
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [redacting, setRedacting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");
  const [processResult, setProcessResult] = useState<any>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
  const [apiModalOpen, setApiModalOpen] = useState(false);

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string) => {
    setNotification({ type, message });
  };

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
      showNotification("error", "Only PDF and DOCX files are supported");
      return;
    }

    setUploadedFile(file);
    setUploading(true);
    setFileResult(null);
    setRedactionResult(null);
    setProcessResult(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setFileResult(data);
      showNotification("success", `File processed successfully! Extracted ${data.wordCount} words from ${data.pageCount || 0} pages.`);
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRedact = async () => {
    if (!fileResult) return;
    
    setRedacting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/redact-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId: fileResult.fileId, retentionMode }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes("Mistral API key not configured")) {
          showNotification("warning", "Mistral API key not configured. Please set it in Settings.", true);
          router.push("/dashboard/settings");
          return;
        }
        throw new Error(error.error || "Redaction failed");
      }

      const data = await response.json();
      setRedactionResult(data);
      setProcessResult(null);
      showNotification("success", `Detected ${data.entities?.length || 0} entities and redacted successfully`);
    } catch (error) {
      console.error("Redaction error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to redact file");
    } finally {
      setRedacting(false);
    }
  };

  const handleProcess = async () => {
    if (!redactionResult) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: redactionResult.jobId, taskType }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes("Mistral API key not configured")) {
          showNotification("warning", "Mistral API key not configured. Please set it in Settings.", true);
          router.push("/dashboard/settings");
          return;
        }
        throw new Error(error.error || "Processing failed");
      }

      const data = await response.json();
      setProcessResult(data);
      showNotification("success", "AI processing completed successfully");
    } catch (error) {
      console.error("Processing error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to process file");
    } finally {
      setProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setFileResult(null);
    setRedactionResult(null);
    setProcessResult(null);
    setShowExtractedText(false);
  };

  const [apiBaseUrl, setApiBaseUrl] = useState("");

  useEffect(() => {
    // Get current domain from window location
    if (typeof window !== "undefined") {
      setApiBaseUrl(window.location.origin);
    }
  }, []);

  const apiExamples = [
    {
      endpoint: "/api/upload",
      method: "POST",
      description: "Upload PDF or DOCX file for text extraction",
      curl: `curl -X POST ${apiBaseUrl || "https://api.privygate.com"}/api/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf"`,
      sampleResponse: {
        fileId: "123e4567-e89b-12d3-a456-426614174000",
        filename: "document.pdf",
        extractedText: "Extracted text content...",
        wordCount: 1234,
        pageCount: 5
      }
    },
    {
      endpoint: "/api/redact-file",
      method: "POST",
      description: "Redact PII from uploaded file",
      curl: `curl -X POST ${apiBaseUrl || "https://api.privygate.com"}/api/redact-file \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileId": "123e4567-e89b-12d3-a456-426614174000",
    "retentionMode": "standard"
  }'`,
      sampleResponse: {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        redactedText: "Contact [NAME_TOKEN_1] at [EMAIL_TOKEN_1]...",
        entities: [
          { type: "NAME", token: "[NAME_TOKEN_1]", confidence: 0.95 }
        ]
      }
    }
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "File Processing" }]} />
      
      {notification && (
        <div className="fixed top-20 right-4 z-50 w-96">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <div className="space-y-6 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">File Processing</h1>
            <p className="text-slate-600 mt-2">
              Process PDF and DOCX documents with automatic text extraction, PII detection, and AI-powered analysis. 
              Large files are automatically chunked and stored in vector database for efficient semantic search and processing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApiModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Code2 className="h-4 w-4" />
            API Usage
          </Button>
        </div>

        {!fileResult ? (
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Upload PDF or DOCX files for text extraction and processing
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
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload">
                    <Button asChild variant="outline" disabled={uploading}>
                      <span>{uploading ? "Uploading..." : "Choose File"}</span>
                    </Button>
                  </label>
                  {uploading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Processing file...</p>
                    </div>
                  )}
                </div>
                {uploadedFile && !uploading && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* File Info Card */}
              <Card className="border border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {fileResult.filename}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        File processed successfully
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">Word Count</Label>
                      <p className="text-lg font-semibold">{fileResult.wordCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Pages</Label>
                      <p className="text-lg font-semibold">{fileResult.pageCount || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">File ID</Label>
                      <p className="text-xs font-mono text-slate-600 truncate">{fileResult.fileId}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Extracted Text</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExtractedText(!showExtractedText)}
                      >
                        {showExtractedText ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    {showExtractedText && (
                      <Textarea
                        value={fileResult.extractedText}
                        readOnly
                        className="min-h-[200px] bg-slate-50 font-mono text-xs"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Redaction Card */}
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    PII Detection & Redaction
                  </CardTitle>
                  <CardDescription>
                    Detect and redact personally identifiable information from the extracted text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Retention Mode</Label>
                    <Select value={retentionMode} onValueChange={(v: any) => setRetentionMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Retention</SelectItem>
                        <SelectItem value="zero">Zero Retention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRedact} disabled={redacting || !fileResult} className="w-full">
                    {redacting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Detecting PII...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Detect & Redact PII
                      </>
                    )}
                  </Button>

                  {redactionResult && (
                    <div className="space-y-4 mt-4 pt-4 border-t">
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
                        <div className="mt-2 p-4 bg-slate-50 rounded-md border border-slate-200 overflow-auto max-h-[500px] custom-scrollbar">
                          <pre className="whitespace-pre-wrap break-words text-sm font-mono text-slate-700">
                            {redactionResult.redactedText}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Processing Card */}
              {redactionResult && (
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      AI Processing
                    </CardTitle>
                    <CardDescription>
                      Process redacted text with Mistral AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label>Task Type</Label>
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
                      <div className="flex items-end">
                        <Button onClick={handleProcess} disabled={processing}>
                          {processing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Process with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {processResult && (
                      <div>
                        <Label>Result</Label>
                        <div className="mt-2 p-4 bg-slate-50 rounded-md border border-slate-200 overflow-auto max-h-[600px] custom-scrollbar">
                          {typeof processResult.result === "string" ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {processResult.result}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap break-words text-sm font-mono text-slate-700">
                              {JSON.stringify(processResult.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

        <APIUsageModal
          open={apiModalOpen}
          onOpenChange={setApiModalOpen}
          examples={apiExamples}
        />
      </div>
    </>
  );
}
