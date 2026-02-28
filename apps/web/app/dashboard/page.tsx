"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface RedactionResult {
  jobId: string;
  redactedText: string;
  entities: Array<{ type: string; token: string; confidence: number }>;
}

export default function DashboardPage() {
  const [inputText, setInputText] = useState("");
  const [retentionMode, setRetentionMode] = useState<"standard" | "zero">("standard");
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [taskType, setTaskType] = useState<"summarize" | "classify" | "extract-actions">("summarize");
  const [processResult, setProcessResult] = useState<any>(null);

  const handleRedact = async () => {
    if (!inputText.trim()) return;
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
      const token = localStorage.getItem("token");
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <>
      <Breadcrumbs items={[{ label: "Text Processing" }]} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Text Processing</h1>
          <p className="text-slate-600 mt-2">
            Detect and redact PII, then process with AI
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
                    <Textarea
                      value={redactionResult.redactedText}
                      readOnly
                      className="min-h-[200px] mt-2 bg-slate-50"
                    />
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
                  <pre className="mt-2 p-4 bg-slate-50 rounded-md text-sm overflow-auto max-h-[400px]">
                    {JSON.stringify(processResult.result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
