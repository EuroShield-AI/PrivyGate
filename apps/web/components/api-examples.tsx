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
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>API Usage</CardTitle>
        <CardDescription>Example code and responses</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            {examples.map((example, idx) => (
              <TabsTrigger key={idx} value={idx.toString()}>
                {example.method} {example.endpoint.split("/").pop()}
              </TabsTrigger>
            ))}
          </TabsList>
          {examples.map((example, idx) => (
            <TabsContent key={idx} value={idx.toString()} className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">{example.description}</p>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-x-auto">
                    <code>{example.curl}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(example.curl, `curl-${idx}`)}
                  >
                    {copied === `curl-${idx}` ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Sample Response</p>
                <div className="relative">
                  <pre className="bg-slate-50 p-4 rounded-md text-xs overflow-x-auto border">
                    <code>{JSON.stringify(example.sampleResponse, null, 2)}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
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
      </CardContent>
    </Card>
  );
}
