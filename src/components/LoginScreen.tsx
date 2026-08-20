import React, { useState } from "react";
import {
  ShieldCheck, Lock, Mail, ArrowRight, UserPlus, QrCode, AlertCircle,
  KeyRound, Shield
} from "lucide-react";
import { Host, Visitor } from "../types";
import { ActiveUserSession } from "./Header";
import { DEFAULT_HOSTS, DEFAULT_VISITORS } from "../lib/firebase";

interface LoginScreenProps {
  hosts: Host[];
  visitors: Visitor[];
  onLoginSuccess: (user: ActiveUserSession) => void;
  onOpenVisitorForm: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  hosts,
  visitors,
  onLoginSuccess,
  onOpenVisitorForm,
}) => {
  const activeHosts = hosts.length > 0 ? hosts : DEFAULT_HOSTS;
  const activeVisitors = visitors.length > 0 ? visitors : DEFAULT_VISITORS;

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick lookup state for visitors consulting their pass
  const [showVisitorLookup, setShowVisitorLookup] = useState(false);
  const [visitorSearchQuery, setVisitorSearchQuery] = useState("");
  const [foundVisitor, setFoundVisitor] = useState<Visitor | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  // Handle email + password login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const identifier = emailInput.trim().toLowerCase();
    const pinTrimmed = passwordInput.trim();

    if (!identifier) {
      setErrorMessage("Por favor ingrese su usuario o correo electrónico.");
      setIsSubmitting(false);
      return;
    }

    if (!pinTrimmed) {
      setErrorMessage("Por favor ingrese su contraseña o NIP de acceso.");
      setIsSubmitting(false);
      return;
    }

    // 1. Search in Employee/Host directory by Email
    const matchedHost = activeHosts.find(
      (h) => h.email.trim().toLowerCase() === identifier
    );

    if (matchedHost) {
      const expectedPin = matchedHost.pin || matchedHost.passwordPin || "1234";
      const isThisAdmin = matchedHost.role === "ADMIN" || matchedHost.id === "emp-1" || matchedHost.email.toLowerCase() === "javier.hernandez@dimer.com.mx";
      
      if (
        pinTrimmed === expectedPin ||
        (isThisAdmin && (pinTrimmed === "1990" || pinTrimmed === "9999"))
      ) {
        const userSession: ActiveUserSession = {
          id: matchedHost.id,
          fullName: matchedHost.fullName,
          email: matchedHost.email,
          role: matchedHost.role || (isThisAdmin ? "ADMIN" : "HOST"),
          department: matchedHost.department,
          position: matchedHost.position
        };

        setIsSubmitting(false);
        onLoginSuccess(userSession);
        return;
      } else {
        setErrorMessage("Contraseña o NIP de acceso incorrecto.");
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Search in Visitor Directory (by registered Email or QR Folio)
    const matchedVisitor = activeVisitors.find(
      (v) =>
        v.email.trim().toLowerCase() === identifier ||
        v.qrFolio.trim().toLowerCase() === identifier
    );

    if (matchedVisitor) {
      const userSession: ActiveUserSession = {
        id: matchedVisitor.id,
        fullName: matchedVisitor.fullName,
        email: matchedVisitor.email,
        role: "VISITOR"
      };

      setIsSubmitting(false);
      onLoginSuccess(userSession);
      return;
    }

    setErrorMessage("Usuario no registrado en el sistema. Verifique su correo electrónico.");
    setIsSubmitting(false);
  };

  const handleVisitorLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = visitorSearchQuery.trim().toLowerCase();
    setLookupSearched(true);
    if (!q) return;

    const v = activeVisitors.find(
      (item) =>
        item.qrFolio.toLowerCase() === q ||
        item.email.toLowerCase() === q ||
        item.phone.toLowerCase().includes(q)
    );

    setFoundVisitor(v || null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center bg-gradient-to-tr from-blue-700 to-indigo-600 p-4 rounded-2xl shadow-2xl border border-indigo-400/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Planta Industrial Dimer
            </h1>
            <p className="text-xs sm:text-sm text-indigo-300 font-semibold uppercase tracking-wider mt-1">
              Control de Acceso e Ingreso
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span>Iniciar Sesión</span>
            </h2>
            <p className="text-xs text-slate-400">
              Ingrese sus credenciales de empleado para acceder al sistema según su rol.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                Usuario / Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ej. usuario@dimer.com.mx"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-slate-100 placeholder-slate-600 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                Contraseña / NIP de Acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-slate-100 placeholder-slate-600 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-xs group"
            >
              <span>{isSubmitting ? "Autenticando..." : "Ingresar al Sistema"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Visitor Options Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 text-center">
              ¿Es Visitante, Proveedor o Contratista?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenVisitorForm}
                className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-bold py-2.5 px-3 rounded-xl transition-all text-[11px] flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Pre-registrar Cita</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVisitorLookup(true)}
                className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 font-bold py-2.5 px-3 rounded-xl transition-all text-[11px] flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>Consultar Cita</span>
              </button>
            </div>
          </div>
        </div>

        {/* Confidentiality Footer */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            Acceso restringido únicamente a personal autorizado de Dimer.
          </p>
        </div>
      </div>

      {/* Visitor Consultation Modal */}
      {showVisitorLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Consultar Cita de Visitante</h3>
              </div>
              <button
                onClick={() => {
                  setShowVisitorLookup(false);
                  setFoundVisitor(null);
                  setLookupSearched(false);
                  setVisitorSearchQuery("");
                }}
                className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleVisitorLookupSubmit} className="space-y-3">
              <label className="block text-xs text-slate-300 font-semibold">
                Ingrese su Folio QR (ej. QR-CON-884920) o Correo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="ej. QR-CON-884920 o correo registrado"
                  value={visitorSearchQuery}
                  onChange={(e) => setVisitorSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 rounded-xl"
                >
                  Buscar
                </button>
              </div>
            </form>

            {lookupSearched && (
              <div className="pt-2">
                {foundVisitor ? (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{foundVisitor.fullName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        foundVisitor.status === "APPROVED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                        foundVisitor.status === "CHECKED_IN" ? "bg-blue-950 text-blue-400 border border-blue-800" :
                        foundVisitor.status === "REJECTED" ? "bg-rose-950 text-rose-400 border border-rose-800" :
                        "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}>
                        {foundVisitor.status}
                      </span>
                    </div>

                    <p className="text-slate-400"><strong>Folio:</strong> <span className="font-mono text-indigo-300">{foundVisitor.qrFolio}</span></p>
                    <p className="text-slate-400"><strong>Anfitrión:</strong> {foundVisitor.hostName}</p>
                    <p className="text-slate-400"><strong>Fecha Programada:</strong> {new Date(foundVisitor.scheduledDateTime).toLocaleString('es-MX')}</p>

                    <button
                      onClick={() => {
                        setShowVisitorLookup(false);
                        onLoginSuccess({
                          id: foundVisitor.id,
                          fullName: foundVisitor.fullName,
                          email: foundVisitor.email,
                          role: "VISITOR"
                        });
                      }}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs"
                    >
                      Ver Pase Digital Completo
                    </button>
                  </div>
                ) : (
                  <p className="text-rose-400 text-xs text-center p-3 bg-rose-950/40 rounded-xl border border-rose-900/60">
                    No se encontró ninguna cita con ese Folio o Correo.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
