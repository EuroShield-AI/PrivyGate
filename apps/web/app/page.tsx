"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
}

interface ProcessResult {
  jobId: string;
  taskType: string;
  result: unknown;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");

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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
              <CardDescription>
                Enter text containing personal data to be redacted
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
                onClick={handleRedact}
                disabled={processing || !inputText.trim()}
                className="w-full"
              >
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
