"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function FilesPage() {
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
        throw new Error("Upload failed");
      }

      const data = await response.json();
      alert(`File uploaded successfully! Extracted ${data.wordCount} words.`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "File Upload" }]} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">File Upload</h1>
          <p className="text-slate-600 mt-2">
            Upload PDF or DOCX files for processing
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
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
