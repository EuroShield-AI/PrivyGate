"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut, Menu, X, FileText, Globe, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Notification } from "@/components/notification";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState("mistral-large-latest");
  const [mistralConfigured, setMistralConfigured] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
  const [savingModel, setSavingModel] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/home");
      return;
    }
    setToken(storedToken);
    
    // Decode JWT to get user info (simple base64 decode)
    try {
      const payload = JSON.parse(atob(storedToken.split(".")[1]));
      setUser(payload);
    } catch (e) {
      console.error("Failed to decode token");
    }

    // Check Mistral API key status first, then fetch model if configured
    checkMistralStatus().then((configured) => {
      if (configured) {
        fetchSelectedModel();
      }
    });
    
    // Fetch user profile for name
    fetchUserProfile();
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch("/api/settings/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkMistralStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;
      
      const response = await fetch("/api/settings/mistral-key", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const configured = data.configured || false;
        setMistralConfigured(configured);
        return configured;
      }
      return false;
    } catch (error) {
      console.error("Error checking Mistral status:", error);
      return false;
    }
  };

  const fetchSelectedModel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch("/api/settings/model", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setModel(data.model || "mistral-large-latest");
      }
    } catch (error) {
      console.error("Error fetching selected model:", error);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSavingModel(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch("/api/settings/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: newModel }),
      });
      
      if (response.ok) {
        setModel(newModel);
        showNotification("success", "Model updated successfully");
      } else {
        const error = await response.json();
        showNotification("error", error.error || "Failed to update model");
      }
    } catch (error) {
      console.error("Error saving model:", error);
      showNotification("error", "Failed to update model");
    } finally {
      setSavingModel(false);
    }
  };

  const showNotification = (type: "success" | "error" | "info" | "warning", message: string) => {
    setNotification({ type, message });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/home");
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {notification && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 z-50 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">PrivyGate</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Model Selector - Only show if API key is configured */}
            {mistralConfigured && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Model</p>
                  <Select value={model} onValueChange={handleModelChange} disabled={savingModel}>
                    <SelectTrigger className="w-[200px] h-8 text-sm border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral-tiny">mistral-tiny</SelectItem>
                      <SelectItem value="mistral-small-latest">mistral-small-latest</SelectItem>
                      <SelectItem value="mistral-medium-latest">mistral-medium-latest</SelectItem>
                      <SelectItem value="mistral-large-latest">mistral-large-latest</SelectItem>
                      <SelectItem value="pixtral-large-latest">pixtral-large-latest</SelectItem>
                      <SelectItem value="open-mistral-7b">open-mistral-7b</SelectItem>
                      <SelectItem value="open-mixtral-8x7b">open-mixtral-8x7b</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="h-2 w-2 bg-green-500 rounded-full" title="Mistral API configured" />
              </div>
            )}

            {/* User & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {userName || user?.email || "User"}
                </p>
                <p className="text-xs text-slate-500">{user?.role || "user"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200 transition-all duration-300 flex-shrink-0 ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden ${sidebarOpen ? "" : "hidden"} lg:block h-full`}
        >
          <nav className="p-4 space-y-1 h-full overflow-y-auto">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Zap className="h-5 w-5" />
              <span>Text Processing</span>
            </Link>
            <Link
              href="/dashboard/files"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/files"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>File Upload</span>
            </Link>
            <Link
              href="/dashboard/gdpr"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/gdpr"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>GDPR Analyzer</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/settings"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
