"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notification } from "@/components/notification";
import { APIUsageModal } from "@/components/api-usage-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code2 } from "lucide-react";

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");
  const [processResult, setProcessResult] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
  const [apiModalOpen, setApiModalOpen] = useState(false);

  useEffect(() => {
    // Check Mistral API key on mount
    const checkMistralKey = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch("/api/settings/mistral-key", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (!data.configured) {
            showNotification("warning", "Mistral API key not configured. Please set it in Settings to use AI features.", true);
          }
        }
      } catch (error) {
        console.error("Error checking Mistral key:", error);
      }
    };
    
    checkMistralKey();
  }, []);

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string, action?: boolean) => {
    setNotification({ type, message });
    if (action && type === "warning") {
      // Auto-dismiss after 5 seconds for warnings with action
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  const handleRedact = async () => {
    if (!inputText.trim()) {
      showNotification("warning", "Please enter some text to process");
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/redact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText, retentionMode }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Redaction failed");
      }
      const data = await response.json();
      setRedactionResult(data);
      setProcessResult(null);
      showNotification("success", `Detected ${data.entitiesDetected || data.entities?.length || 0} entities and redacted successfully`);
    } catch (error) {
      console.error("Redaction error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to redact text");
    } finally {
      setProcessing(false);
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
      showNotification("error", error instanceof Error ? error.message : "Failed to process text");
    } finally {
      setProcessing(false);
    }
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
      endpoint: "/api/redact",
      method: "POST",
      description: "Detect and redact PII from text",
      curl: `curl -X POST ${apiBaseUrl || "https://api.privygate.com"}/api/redact \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Contact John Doe at john@example.com or call 555-1234",
    "retentionMode": "standard"
  }'`,
      sampleResponse: {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        redactedText: "Contact [NAME_TOKEN_1] at [EMAIL_TOKEN_1] or call [PHONE_TOKEN_1]",
        entities: [
          { type: "NAME", token: "[NAME_TOKEN_1]", confidence: 0.95 },
          { type: "EMAIL", token: "[EMAIL_TOKEN_1]", confidence: 1.0 },
          { type: "PHONE", token: "[PHONE_TOKEN_1]", confidence: 0.98 }
        ],
        entitiesDetected: 3
      }
    },
    {
      endpoint: "/api/process",
      method: "POST",
      description: "Process redacted text with AI",
      curl: `curl -X POST ${apiBaseUrl || "https://api.privygate.com"}/api/process \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jobId": "123e4567-e89b-12d3-a456-426614174000",
    "taskType": "summarize"
  }'`,
      sampleResponse: {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        taskType: "summarize",
        result: {
          summary: "This document contains contact information for a person..."
        }
      }
    }
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Text Processing" }]} />
      
      {notification && (
        <div className="fixed top-20 right-4 z-50 w-96">
          <Card className={`p-4 border ${
            notification.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
            notification.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
            notification.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm font-medium">{notification.message}</p>
              {notification.type === "warning" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/settings")}
                  className="ml-2"
                >
                  Go to Settings
                </Button>
              )}
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-6 overflow-y-auto">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Text Processing</h1>
            <p className="text-slate-600 mt-2">
              Detect and redact personally identifiable information (PII) from your text, then process it securely with AI. 
              All sensitive data is automatically pseudonymized before AI processing.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Input Text</CardTitle>
                <CardDescription>
                  Enter text containing personal information to be redacted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Text Content</Label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text with personal information (emails, names, phone numbers, etc.)..."
                    className="min-h-[300px] mt-2"
                  />
                </div>
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
                <Button onClick={handleRedact} disabled={processing || !inputText.trim()} className="w-full">
                  {processing ? "Processing..." : "Detect & Redact PII"}
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
                      {processing ? "Processing..." : "Process with AI"}
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
            </div>

            <APIUsageModal
              open={apiModalOpen}
              onOpenChange={setApiModalOpen}
              examples={apiExamples}
            />
          </div>
        </>
      );
    }
