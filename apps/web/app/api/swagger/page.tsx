"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { 
  ssr: false,
  loading: () => <div className="p-8">Loading API documentation...</div>
});

export default function SwaggerPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Swagger UI CSS dynamically if not already loaded
    const existingLink = document.querySelector('link[href*="swagger-ui"]');
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch API docs");
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading Swagger spec:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading API documentation</p>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">No API documentation available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        .swagger-ui {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .swagger-ui .topbar {
          display: none;
        }
      `}</style>
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-900">API Documentation</h1>
          <p className="text-xs text-slate-600">Interactive API reference with Swagger UI</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </Link>
      </div>
      <SwaggerUI spec={spec} />
    </div>
  );
}
