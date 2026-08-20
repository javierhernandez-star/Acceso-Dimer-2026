import React, { useState, useEffect } from "react";
import { Visitor, VisitorProfile, Host, AuditLog, AppConfig, UserRole } from "./types";
import {
  subscribeVisitors,
  subscribeVisitorProfiles,
  subscribeHosts,
  subscribeAuditLogs,
  subscribeConfig,
  seedInitialDataIfEmpty
} from "./lib/firebase";
import { Header, ActiveUserSession } from "./components/Header";
import { LoginScreen } from "./components/LoginScreen";
import { VisitorPublicForm } from "./components/VisitorPublicForm";
import { GuardPanel } from "./components/GuardPanel";
import { HostPanel } from "./components/HostPanel";
import { AdminPanel } from "./components/AdminPanel";

export default function App() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [profiles, setProfiles] = useState<VisitorProfile[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    guardPin: "1234",
    adminPin: "1990",
    companyName: "Planta Industrial Dimer - Control de Acceso"
  });

  // Current User Session State (null = show Login Screen)
  const [currentUser, setCurrentUser] = useState<ActiveUserSession | null>(null);

  // Current view tab
  const [currentView, setCurrentView] = useState<"visitor" | "guard" | "host" | "admin">("admin");
  
  // Is standalone visitor link mode
  const [isVisitorOnlyMode, setIsVisitorOnlyMode] = useState(false);
  const [preselectedHostId, setPreselectedHostId] = useState<string | undefined>();

  // Login handler
  const handleLoginSuccess = (user: ActiveUserSession) => {
    setCurrentUser(user);
    if (user.role === "ADMIN") {
      setCurrentView("admin");
    } else if (user.role === "GUARD") {
      setCurrentView("guard");
    } else if (user.role === "HOST") {
      setCurrentView("host");
    } else if (user.role === "VISITOR") {
      setCurrentView("visitor");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setIsVisitorOnlyMode(false);
  };

  // Check URL query params for ?mode=visitor and #preregister
  useEffect(() => {
    const handleUrlCheck = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get("mode");
      const hostId = searchParams.get("hostId");
      const hash = window.location.hash;

      if (mode === "visitor" || hash === "#preregister") {
        setIsVisitorOnlyMode(true);
        setCurrentView("visitor");
        if (hostId) {
          setPreselectedHostId(hostId);
        }
      }
    };

    handleUrlCheck();
    window.addEventListener("hashchange", handleUrlCheck);
    return () => window.removeEventListener("hashchange", handleUrlCheck);
  }, []);

  // Initialize and subscribe to Firestore collections
  useEffect(() => {
    // Seed default data if empty
    seedInitialDataIfEmpty();

    // 1. Visitors real-time subscription
    const unsubVisitors = subscribeVisitors((data) => {
      setVisitors(data);
    });

    // 1.1 Visitor Profiles real-time subscription
    const unsubProfiles = subscribeVisitorProfiles((data) => {
      setProfiles(data);
    });

    // 2. Hosts real-time subscription
    const unsubHosts = subscribeHosts((data) => {
      setHosts(data);
    });

    // 3. Audit Logs real-time subscription
    const unsubAudit = subscribeAuditLogs((data) => {
      setAuditLogs(data);
    });

    // 4. Config real-time subscription
    const unsubConfig = subscribeConfig((data) => {
      setConfig(data);
    });

    return () => {
      unsubVisitors();
      unsubProfiles();
      unsubHosts();
      unsubAudit();
      unsubConfig();
    };
  }, []);

  // Show Login Screen if no active session (unless in public visitor mode or visitor tab opened)
  if (!currentUser && !isVisitorOnlyMode) {
    if (currentView === "visitor") {
      return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col antialiased">
          <header className="bg-slate-900 text-white py-4 px-6 flex justify-between items-center shadow-lg">
            <h1 className="font-bold text-base">Pre-registro de Visitantes — Dimer</h1>
            <button
              onClick={() => setCurrentView("admin")}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700"
            >
              Ir a Inicio de Sesión
            </button>
          </header>
          <main className="flex-1 pb-12">
            <VisitorPublicForm preselectedHostId={preselectedHostId} />
          </main>
        </div>
      );
    }

    return (
      <LoginScreen
        hosts={hosts}
        visitors={visitors}
        onLoginSuccess={handleLoginSuccess}
        onOpenVisitorForm={() => setCurrentView("visitor")}
      />
    );
  }

  // View renderer for authenticated session
  const renderCurrentView = () => {
    switch (currentView) {
      case "visitor":
        return <VisitorPublicForm preselectedHostId={preselectedHostId} />;
      case "guard":
        return <GuardPanel visitors={visitors} hosts={hosts} config={config} currentUser={currentUser || undefined} />;
      case "host":
        return <HostPanel visitors={visitors} hosts={hosts} currentUser={currentUser || undefined} />;
      case "admin":
        return <AdminPanel hosts={hosts} auditLogs={auditLogs} config={config} visitors={visitors} profiles={profiles} />;
      default:
        return <GuardPanel visitors={visitors} hosts={hosts} config={config} currentUser={currentUser || undefined} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {currentUser && (
        <Header
          currentView={currentView}
          onSelectView={(v) => {
            setIsVisitorOnlyMode(false);
            setCurrentView(v);
          }}
          isVisitorOnlyMode={isVisitorOnlyMode}
          currentUser={currentUser}
          hosts={hosts}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 pb-12">
        {renderCurrentView()}
      </main>

      <footer className="bg-slate-900 text-slate-500 text-xs py-4 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {config.companyName}. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore Sync Active
            </span>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="hover:text-blue-400 transition-colors underline"
            >
              Cambiar de Usuario
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
