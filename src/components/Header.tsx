import React, { useState } from "react";
import { Shield, Building2, UserCheck, ShieldCheck, ExternalLink, Wifi, Copy, Check, QrCode, X, UserPlus, LogOut } from "lucide-react";
import { getCleanPublicVisitorUrl } from "../lib/utils";
import { Host, UserRole } from "../types";

export interface ActiveUserSession {
  id?: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  position?: string;
}

interface HeaderProps {
  currentView: "visitor" | "guard" | "host" | "admin";
  onSelectView: (view: "visitor" | "guard" | "host" | "admin") => void;
  isVisitorOnlyMode?: boolean;
  currentUser: ActiveUserSession;
  hosts: Host[];
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  isVisitorOnlyMode = false,
  currentUser,
  hosts,
  onLogout,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const internalVisitorUrl = `${window.location.origin}/?mode=visitor#preregister`;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Determine permitted tabs based strictly on currentUser.role
  const canAccessAdmin = currentUser.role === "ADMIN";
  const canAccessGuard = currentUser.role === "ADMIN" || currentUser.role === "GUARD";
  const canAccessHost = currentUser.role === "ADMIN" || currentUser.role === "HOST";
  const canAccessVisitor = currentUser.role === "ADMIN" || currentUser.role === "VISITOR";

  if (isVisitorOnlyMode) {
    return (
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white font-black text-xl shadow">
              D
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Pre-registro de Visitantes
              </h1>
              <p className="text-xs text-slate-400">Planta Industrial Dimer — Control de Acceso</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium hidden sm:inline">Portal Oficial Activo</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Corporate Title */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/10 text-white border border-white/10">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                    Acceso Industrial Dimer
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sincronizado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Control de Citas, Pases QR y Caseta
                </p>
              </div>
            </div>

            {/* Role-Aware Navigation Tabs */}
            <nav className="flex items-center bg-slate-800/70 p-1 rounded-xl border border-slate-700/60">
              {canAccessAdmin && (
                <button
                  id="nav-admin-btn"
                  onClick={() => onSelectView("admin")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "admin"
                      ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Administración</span>
                </button>
              )}

              {canAccessGuard && (
                <button
                  id="nav-guard-btn"
                  onClick={() => onSelectView("guard")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "guard"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Caseta</span>
                </button>
              )}

              {canAccessHost && (
                <button
                  id="nav-host-btn"
                  onClick={() => onSelectView("host")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "host"
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Anfitrión</span>
                </button>
              )}

              {canAccessVisitor && (
                <button
                  id="nav-visitor-btn"
                  onClick={() => onSelectView("visitor")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "visitor"
                      ? "bg-emerald-600 text-white shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Pre-registro</span>
                </button>
              )}
            </nav>

            {/* Active User Session & Actions */}
            <div className="flex items-center space-x-2">
              <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
                  currentUser.role === 'ADMIN' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50' :
                  currentUser.role === 'GUARD' ? 'bg-blue-900/60 text-blue-200 border border-blue-700/50' :
                  currentUser.role === 'HOST' ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/50' :
                  'bg-emerald-900/60 text-emerald-200 border border-emerald-700/50'
                }`}>
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : "U"}
                </div>

                <div className="text-left hidden md:block">
                  <p className="font-bold text-xs leading-tight text-white truncate max-w-[140px]">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {currentUser.role === 'ADMIN' ? '👑 Administrador' :
                     currentUser.role === 'GUARD' ? '🛡️ Guardia Caseta' :
                     currentUser.role === 'HOST' ? `👤 ${currentUser.department || 'Anfitrión'}` : '👥 Visitante'}
                  </p>
                </div>

                <button
                  onClick={onLogout}
                  className="bg-slate-700/70 hover:bg-rose-600/80 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs ml-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Salir</span>
                </button>
              </div>

              {/* Share Public Link Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden lg:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                title="Obtener enlace público de registro para visitantes"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Enlace Público</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Enlace de Pre-registro de Visitantes</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-slate-800">
              <p className="text-xs text-slate-600">
                Comparta este enlace con visitantes o contratistas para que realicen su pre-registro desde su celular o equipo de cómputo.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Enlace Directo:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={internalVisitorUrl}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-lg text-xs p-2.5 font-mono text-slate-800 select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(internalVisitorUrl)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    onSelectView("visitor");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  Probar Pre-registro ahora
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
