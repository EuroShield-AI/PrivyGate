"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface APIExample {
  endpoint: string;
  method: string;
  description: string;
  curl: string;
  sampleResponse: any;
}

interface APIUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examples: APIExample[];
}

export function APIUsageModal({ open, onOpenChange, examples }: APIUsageModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Usage Examples</DialogTitle>
          <DialogDescription>
            Example code and responses for API endpoints
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-1 mb-4 bg-slate-100">
              {examples.map((example, idx) => (
                <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                  {example.method} {example.endpoint.split("/").pop()}
                </TabsTrigger>
              ))}
            </TabsList>
            {examples.map((example, idx) => (
              <TabsContent key={idx} value={idx.toString()} className="space-y-3 mt-0">
                <div>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">{example.description}</p>
                  <div className="relative bg-slate-900 rounded border border-slate-700">
                    <pre className="text-slate-100 p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words">
                      <code className="font-mono">{example.curl}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700"
                      onClick={() => copyToClipboard(example.curl, `curl-${idx}`)}
                    >
                      {copied === `curl-${idx}` ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-slate-700">Sample Response</p>
                  <div className="relative bg-slate-50 rounded border border-slate-200">
                    <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
                      <code className="font-mono text-slate-700">{JSON.stringify(example.sampleResponse, null, 2)}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-white hover:bg-slate-100"
                      onClick={() => copyToClipboard(JSON.stringify(example.sampleResponse, null, 2), `response-${idx}`)}
                    >
                      {copied === `response-${idx}` ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
