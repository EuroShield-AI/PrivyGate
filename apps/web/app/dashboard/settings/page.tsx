"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Notification } from "@/components/notification";
import { Key, Save, CheckCircle2, AlertCircle, TestTube, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [oauthClientId, setOauthClientId] = useState("pk_live_51H8xK2...");
  const [oauthClientSecret, setOauthClientSecret] = useState("sk_live_51H8xK2...");

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch (e) {
        console.error("Failed to decode token");
      }
    }

    // Check if API key is configured
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    setChecking(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings/mistral-key", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeyConfigured(data.configured);
        if (!data.configured) {
          showNotification("warning", "Mistral API key not configured. Please enter your API key to enable AI features.");
        }
      }
    } catch (error) {
      console.error("Error checking API key:", error);
    } finally {
      setChecking(false);
    }
  };

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string) => {
    setNotification({ type, message });
  };

  const handleSaveMistralKey = async () => {
    if (!mistralApiKey.trim()) {
      showNotification("warning", "Please enter your Mistral API key");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings/mistral-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: mistralApiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save API key");
      }

      setMistralApiKey("");
      setApiKeyConfigured(true);
      showNotification("success", "Mistral API key saved and encrypted successfully");
    } catch (error) {
      console.error("Error saving API key:", error);
      showNotification("error", error instanceof Error ? error.message : "Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings/mistral-key/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        showNotification("success", "Connection successful! API key is valid.");
      } else {
        showNotification("error", data.error || "Connection failed. Please check your API key.");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      showNotification("error", "Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    showNotification("success", "Copied to clipboard");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Settings" }]} />
      
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
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-2">
              Manage your API credentials and preferences. 
              Your Mistral API key is encrypted and stored securely for AI-powered features.
            </p>
          </div>

          <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Mistral API Configuration
            </CardTitle>
            <CardDescription>
              Enter your Mistral AI API key to enable AI-powered features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checking ? (
              <div className="flex items-center gap-2 text-slate-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Checking API key status...</span>
              </div>
            ) : apiKeyConfigured ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">API Key Configured</p>
                  <p className="text-xs text-green-700">Your Mistral API key is encrypted and stored securely</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">API Key Required</p>
                  <p className="text-xs text-yellow-700">Enter your Mistral API key to enable AI features</p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="mistral-key">Mistral API Key</Label>
              <Input
                id="mistral-key"
                type="password"
                placeholder="Enter your Mistral API key"
                value={mistralApiKey}
                onChange={(e) => setMistralApiKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from{" "}
                <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Mistral Console
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveMistralKey} disabled={loading || !mistralApiKey.trim()} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save API Key
                    </>
                  )}
              </Button>
              {apiKeyConfigured && (
                <Button onClick={handleTestConnection} disabled={testing} variant="outline">
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" type="text" value={user?.role || "user"} disabled />
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-slate-200 sticky top-20">
            <CardHeader>
              <CardTitle>OAuth Credentials</CardTitle>
              <CardDescription>API authentication credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={oauthClientId}
                    readOnly
                    className="font-mono text-xs bg-slate-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(oauthClientId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Client Secret</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="password"
                    value={oauthClientSecret}
                    readOnly
                    className="font-mono text-xs bg-slate-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(oauthClientSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/api/oauth/credentials")}
              >
                Create New Credentials
              </Button>
              <p className="text-xs text-slate-500">
                Use these credentials to authenticate API requests. Click to create new credentials.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
