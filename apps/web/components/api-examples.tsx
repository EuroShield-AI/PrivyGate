"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function APIExamples({ examples }: { examples: APIExample[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="h-full border border-slate-200 flex flex-col">
      <CardHeader className="border-b border-slate-200 flex-shrink-0">
        <CardTitle className="text-lg">API Usage</CardTitle>
        <CardDescription className="text-xs">Example code and responses</CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto">
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full grid-cols-1 gap-1 mb-4 bg-slate-100">
            {examples.map((example, idx) => (
              <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                {example.method} {example.endpoint.split("/").pop()}
              </TabsTrigger>
            ))}
          </TabsList>
          {examples.map((example, idx) => (
            <TabsContent key={idx} value={idx.toString()} className="space-y-3 mt-0">
              <div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{example.description}</p>
                <div className="relative bg-slate-900 rounded border border-slate-700">
                  <pre className="text-slate-100 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    <code className="font-mono">{example.curl}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-slate-800 hover:bg-slate-700"
                    onClick={() => copyToClipboard(example.curl, `curl-${idx}`)}
                  >
                    {copied === `curl-${idx}` ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-slate-700">Sample Response</p>
                <div className="relative bg-slate-50 rounded border border-slate-200">
                  <pre className="p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    <code className="font-mono text-slate-700">{JSON.stringify(example.sampleResponse, null, 2)}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-white hover:bg-slate-100"
                    onClick={() => copyToClipboard(JSON.stringify(example.sampleResponse, null, 2), `response-${idx}`)}
                  >
                    {copied === `response-${idx}` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
