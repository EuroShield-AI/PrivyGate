"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut, Menu, X, FileText, Globe, Settings, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [tokenUsage, setTokenUsage] = useState({ used: 0, limit: 1000000 });
  const [model, setModel] = useState("mistral-large-latest");

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

    // Fetch token usage (mock for now)
    fetchTokenUsage();
  }, [router]);

  const fetchTokenUsage = async () => {
    // TODO: Implement actual token usage API
    setTokenUsage({ used: 125000, limit: 1000000 });
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
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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
            {/* Token Usage */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Model</p>
                <p className="text-sm font-medium text-slate-900">{model}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Tokens</p>
                <p className="text-sm font-medium text-slate-900">
                  {tokenUsage.used.toLocaleString()} / {tokenUsage.limit.toLocaleString()}
                </p>
              </div>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(tokenUsage.used / tokenUsage.limit) * 100}%` }}
                />
              </div>
            </div>

            {/* User & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.email || "User"}</p>
                <p className="text-xs text-slate-500">{user?.role || "user"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200 transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden ${sidebarOpen ? "" : "hidden"} lg:block`}
        >
          <nav className="p-4 space-y-1">
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
              href="/dashboard/analytics"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/analytics"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
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
        <main className="flex-1 min-w-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
