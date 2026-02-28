"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notification } from "@/components/notification";
import { APIExamples } from "@/components/api-examples";

export default function FilesPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);

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
      showNotification("success", `File uploaded successfully! Extracted ${data.wordCount} words from ${data.pageCount || 0} pages.`);
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const apiExamples = [
    {
      endpoint: "/api/upload",
      method: "POST",
      description: "Upload PDF or DOCX file for text extraction",
      curl: `curl -X POST https://api.privygate.com/api/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf"`,
      sampleResponse: {
        fileId: "123e4567-e89b-12d3-a456-426614174000",
        filename: "document.pdf",
        extractedText: "Extracted text content...",
        wordCount: 1234,
        pageCount: 5
      }
    }
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "File Upload" }]} />
      
      {notification && (
        <div className="fixed top-20 right-4 z-50 w-96">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">File Upload</h1>
            <p className="text-slate-600 mt-2">
              Upload PDF or DOCX documents for automatic text extraction and processing. 
              Large files are automatically chunked and stored in vector database for efficient AI processing.
            </p>
          </div>

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
              {uploadedFile && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm flex-1">{uploadedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <APIExamples examples={apiExamples} />
        </div>
      </div>
    </>
  );
}
