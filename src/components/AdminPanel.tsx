import React, { useState, useEffect } from "react";
import { Host, AuditLog, AppConfig, Visitor, VisitorProfile, UserRole } from "../types";
import {
  addHost,
  updateHost,
  deleteHost,
  updateAppConfig,
  forceSeedInitialData,
  deleteVisitor,
  updateVisitorStatus,
  addVisitorProfile,
  updateVisitorProfile,
  deleteVisitorProfile
} from "../lib/firebase";
import { sendNoReplyEmailNotification, sendEmailViaAppsScriptWebhook } from "../lib/notifications";
import {
  connectGmailAccount,
  disconnectGmailAccount,
  getGmailAccessToken,
  getGmailUser,
  subscribeGmailAuth,
  sendEmailViaGmailApi
} from "../lib/googleAuth";
import { VisitorEditModal } from "./VisitorEditModal";
import { AdminVisitorsTab } from "./AdminVisitorsTab";
import { AdminVisitorProfilesTab } from "./AdminVisitorProfilesTab";
import { AdminEmployeesTab } from "./AdminEmployeesTab";
import { AdminAuditTab } from "./AdminAuditTab";
import {
  Building2,
  KeyRound,
  Users,
  FileSpreadsheet,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  RefreshCw,
  Search,
  Lock,
  AlertCircle,
  UserCheck,
  Calendar,
  CheckCircle2,
  Mail,
  Send,
  Sparkles
} from "lucide-react";

interface AdminPanelProps {
  hosts: Host[];
  auditLogs: AuditLog[];
  config: AppConfig;
  visitors: Visitor[];
  profiles?: VisitorProfile[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ hosts, auditLogs, config, visitors, profiles = [] }) => {
  // PIN Protection State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Active Tab: Citas & Pases, Padrón Único, Directorio de Empleados, Bitácora, Ajustes
  const [activeTab, setActiveTab] = useState<"directory" | "visitor_profiles" | "visitors" | "audit" | "settings">("visitors");

  // Host Form Modal
  const [showHostModal, setShowHostModal] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [hostDept, setHostDept] = useState("Gerencia General");
  const [hostPos, setHostPos] = useState("Gerente");
  const [hostPin, setHostPin] = useState("1234");
  const [hostRole, setHostRole] = useState<UserRole>("HOST");

  // Visitor Management
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [showVisitorCreateModal, setShowVisitorCreateModal] = useState(false);
  const [rejectVisitorModal, setRejectVisitorModal] = useState<Visitor | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // PIN & System Settings Form
  const [guardPinForm, setGuardPinForm] = useState(config.guardPin);
  const [adminPinForm, setAdminPinForm] = useState(config.adminPin);
  const [noReplyEmailForm, setNoReplyEmailForm] = useState(config.noReplyEmail || "no-reply@dimer.com.mx");
  const [noReplySenderNameForm, setNoReplySenderNameForm] = useState(config.noReplySenderName || "No-Reply Control de Acceso");
  const [appsScriptWebhookUrlForm, setAppsScriptWebhookUrlForm] = useState(config.appsScriptWebhookUrl || "");
  const [pinSuccessMsg, setPinSuccessMsg] = useState(false);

  // Gmail No-Reply Auth State
  const [gmailUser, setGmailUser] = useState(getGmailUser());
  const [gmailToken, setGmailToken] = useState<string | null>(getGmailAccessToken());
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeGmailAuth((user, token) => {
      setGmailUser(user);
      setGmailToken(token);
    });
    return () => unsub();
  }, []);

  const [connectFeedback, setConnectFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    setTestEmailStatus(null);
    setConnectFeedback(null);
    try {
      const res = await connectGmailAccount();
      setTestEmailAddress(res.user.email || "");
      setConnectFeedback({
        msg: `¡Cuenta Google No-Reply conectada con éxito! (${res.user.email})`,
        isError: false
      });
      setTimeout(() => setConnectFeedback(null), 5000);
    } catch (err: any) {
      // User closed popup or blocked popup - handle smoothly with in-UI message
      setConnectFeedback({
        msg: err.message || "No se completó la conexión de Google.",
        isError: err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request"
      });
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (window.confirm("¿Desea desconectar la cuenta No-Reply de Gmail?")) {
      await disconnectGmailAccount();
      setTestEmailStatus(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      alert("Por favor ingrese una dirección de correo para la prueba.");
      return;
    }

    if (appsScriptWebhookUrlForm.trim()) {
      setTestEmailStatus("Enviando correo de prueba vía Google Apps Script Webhook (MailApp noReply)...");
      const res = await sendEmailViaAppsScriptWebhook(
        appsScriptWebhookUrlForm.trim(),
        testEmailAddress.trim(),
        "[Prueba No-Reply] Confirmación de Envío - Control de Acceso",
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #059669; margin-top: 0;">¡Envío Exitoso con Google Apps Script No-Reply!</h2>
          <p>Este es un correo de prueba enviado desde el <strong>Sistema de Control de Acceso</strong> a través del motor de Google Apps Script con <code>noReply: true</code>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">Despachado exactamente igual que AutoCrat mediante Google Apps Script.</p>
        </div>`,
        config.noReplySenderName || "No-Reply Control de Acceso"
      );

      if (res.success) {
        setTestEmailStatus(`¡Correo de prueba enviado con éxito vía Google Apps Script!`);
      } else {
        setTestEmailStatus(`Error al enviar vía Apps Script: ${res.error}`);
      }
      return;
    }

    setTestEmailStatus("Enviando correo de prueba vía Gmail API...");
    const res = await sendEmailViaGmailApi(
      testEmailAddress.trim(),
      "[Prueba No-Reply] Confirmación de Conexión de Correo - Control de Acceso",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">¡Conexión Exitosa con Google Gmail No-Reply!</h2>
        <p>Este es un correo de prueba enviado desde el <strong>Sistema de Control de Acceso de Planta Industrial</strong>.</p>
        <p>A partir de este momento, todos los visitantes y anfitriones recibirán notificaciones automáticas reales en tiempo real cuando agenden, aprueben o rechacen sus citas.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8;">Enviado automáticamente vía Google Workspace OAuth2 Gmail API.</p>
      </div>`,
      {
        senderDisplayName: config.noReplySenderName || "No-Reply Control de Acceso",
        replyToEmail: config.noReplyEmail || "noreply@dimer.com.mx",
        fromEmail: config.noReplyEmail || "noreply@dimer.com.mx"
      }
    );

    if (res.success) {
      setTestEmailStatus(`¡Correo de prueba enviado con éxito! ID de Mensaje: ${res.messageId}`);
    } else {
      setTestEmailStatus(`Error al enviar: ${res.error}`);
    }
  };

  // Login handler
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === config.adminPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  // Open Host Modal (Create or Edit)
  const handleOpenHostModal = (host?: Host) => {
    if (host) {
      setEditingHost(host);
      setHostName(host.fullName);
      setHostEmail(host.email);
      setHostPhone(host.phone);
      setHostDept(host.department);
      setHostPos(host.position);
      setHostPin(host.pin || host.passwordPin || "1234");
      setHostRole(host.role || "HOST");
    } else {
      setEditingHost(null);
      setHostName("");
      setHostEmail("");
      setHostPhone("");
      setHostDept("Gerencia General");
      setHostPos("Supervisor / Jefe");
      setHostPin("1234");
      setHostRole("HOST");
    }
    setShowHostModal(true);
  };

  // Save Host
  const handleSaveHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName || !hostEmail || !hostDept) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    try {
      if (editingHost) {
        await updateHost(editingHost.id, {
          fullName: hostName.trim(),
          email: hostEmail.trim(),
          phone: hostPhone.trim(),
          department: hostDept.trim(),
          position: hostPos.trim(),
          pin: hostPin.trim() || "1234",
          passwordPin: hostPin.trim() || "1234",
          role: hostRole
        });
      } else {
        await addHost({
          fullName: hostName.trim(),
          email: hostEmail.trim(),
          phone: hostPhone.trim(),
          department: hostDept.trim(),
          position: hostPos.trim(),
          pin: hostPin.trim() || "1234",
          passwordPin: hostPin.trim() || "1234",
          role: hostRole,
          status: "ACTIVE"
        });
      }
      setShowHostModal(false);
    } catch (err) {
      console.error("Error saving host:", err);
      alert("Error al guardar el empleado.");
    }
  };

  // Toggle Active/Inactive Host
  const handleToggleHostStatus = async (host: Host) => {
    const nextStatus = host.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateHost(host.id, { status: nextStatus });
    } catch (err) {
      console.error("Error updating host status:", err);
    }
  };

  // Delete Host
  const handleDeleteHost = async (host: Host) => {
    if (window.confirm(`¿Está seguro de eliminar al empleado ${host.fullName}?`)) {
      try {
        await deleteHost(host.id, host.fullName);
      } catch (err) {
        console.error("Error deleting host:", err);
      }
    }
  };

  // Delete Visitor (Admin)
  const handleDeleteVisitor = async (v: Visitor) => {
    if (window.confirm(`¿Está seguro de eliminar el registro de ${v.fullName}?`)) {
      try {
        await deleteVisitor(v.id, "Administrador del Sistema", `Registro de visitante eliminado por Administrador.`);
      } catch (err) {
        console.error("Error deleting visitor:", err);
      }
    }
  };

  // Approve Visitor (Admin)
  const handleApproveVisitor = async (v: Visitor) => {
    try {
      await updateVisitorStatus(
        v.id,
        { status: "APPROVED" },
        "Administrador del Sistema",
        "APPROVE",
        `Cita de ${v.fullName} aprobada directamente por el Administrador.`
      );

      // Trigger Google No-Reply Email Notification in background
      sendNoReplyEmailNotification("APROBACION", {
        ...v,
        status: "APPROVED"
      }).catch(() => {});
    } catch (err) {
      console.error("Error approving visitor:", err);
      alert("Error al aprobar la cita.");
    }
  };

  // Reject Visitor (Admin Modal)
  const handleConfirmRejectVisitor = async () => {
    if (!rejectVisitorModal) return;
    const reason = rejectionReasonInput.trim() || "Rechazada por Administrador";
    try {
      const updatedVisitor: Visitor = {
        ...rejectVisitorModal,
        status: "REJECTED",
        rejectionReason: reason
      };

      await updateVisitorStatus(
        rejectVisitorModal.id,
        {
          status: "REJECTED",
          rejectionReason: reason
        },
        "Administrador del Sistema",
        "REJECT",
        `Cita de ${rejectVisitorModal.fullName} rechazada por Administrador. Motivo: ${reason}`
      );

      // Trigger Google No-Reply Email Notification in background
      sendNoReplyEmailNotification("RECHAZO", updatedVisitor, reason).catch(() => {});

      setRejectVisitorModal(null);
      setRejectionReasonInput("");
    } catch (err) {
      console.error("Error rejecting visitor:", err);
      alert("Error al rechazar la cita.");
    }
  };

  // Save Config PINs & No-Reply Email Settings
  const handleSavePins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardPinForm.length !== 4 || adminPinForm.length !== 4) {
      alert("Los NIPs deben constar exactamente de 4 dígitos.");
      return;
    }

    try {
      await updateAppConfig({
        ...config,
        guardPin: guardPinForm,
        adminPin: adminPinForm,
        noReplyEmail: noReplyEmailForm.trim() || "no-reply@dimer.com.mx",
        noReplySenderName: noReplySenderNameForm.trim() || "No-Reply Control de Acceso",
        appsScriptWebhookUrl: appsScriptWebhookUrlForm.trim()
      });
      setPinSuccessMsg(true);
      setTimeout(() => setPinSuccessMsg(false), 3000);
    } catch (err) {
      console.error("Error updating config:", err);
      alert("Error al guardar la configuración.");
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      config,
      hosts,
      visitors,
      auditLogs
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Respaldo_ControlAcceso_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  // Seed Data Trigger
  const handleSeedData = async () => {
    try {
      await forceSeedInitialData();
      alert("¡Datos de demostración (anfitriones y visitantes de prueba) restaurados correctamente en Firestore!");
    } catch (err: any) {
      alert("Error al cargar datos de prueba: " + err.message);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Panel de Administración</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingrese su NIP de Administrador de 4 dígitos
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="NIP Admin (Predeterminado: 9999)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:bg-white outline-none"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">
                NIP de Administrador incorrecto. Intente de nuevo.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md text-sm transition-colors"
            >
              Ingresar al Panel Admin
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            NIP por defecto: <span className="font-mono font-bold text-slate-600">9999</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Top Header & Tab Navigation */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Administración y Auditoría del Sistema</h2>
            <p className="text-xs text-slate-400">
              Gestión de Empleados, Bitácora General de Acceso y Configuración
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "directory"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Empleados ({hosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("visitor_profiles")}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "visitor_profiles"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Visitantes ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("visitors")}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "visitors"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Citas & Pases ({visitors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bitácora ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Ajustes & NIPs</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
            title="Bloquear Admin"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {activeTab === "directory" && (
        <AdminEmployeesTab
          hosts={hosts}
          allVisitors={visitors}
          allLogs={auditLogs}
          onOpenCreateModal={() => handleOpenHostModal()}
          onOpenEditModal={(h) => handleOpenHostModal(h)}
          onToggleStatus={(h) => handleToggleHostStatus(h)}
          onDeleteHost={(h) => handleDeleteHost(h)}
        />
      )}

      {/* TAB 2: PADRON EXCLUSIVO DE VISITANTES (PERMANENTE) */}
      {activeTab === "visitor_profiles" && (
        <AdminVisitorProfilesTab
          profiles={profiles}
          onAddProfile={async (p) => {
            await addVisitorProfile(p);
          }}
          onUpdateProfile={async (id, updates) => {
            await updateVisitorProfile(id, updates);
          }}
          onDeleteProfile={async (id, name) => {
            await deleteVisitorProfile(id, name);
          }}
        />
      )}

      {/* TAB 3: CITAS & PASES INDIVIDUALES */}
      {activeTab === "visitors" && (
        <AdminVisitorsTab
          visitors={visitors}
          hosts={hosts}
          onOpenCreateModal={() => {
            setEditingVisitor(null);
            setShowVisitorCreateModal(true);
          }}
          onEditVisitor={(v) => setEditingVisitor(v)}
          onDeleteVisitor={handleDeleteVisitor}
          onOpenRejectModal={(v) => setRejectVisitorModal(v)}
          onApproveVisitor={handleApproveVisitor}
        />
      )}

      {/* TAB 3: AUDIT LOGS & DASHBOARD */}
      {activeTab === "audit" && (
        <AdminAuditTab
          auditLogs={auditLogs}
          visitors={visitors}
          hosts={hosts}
          onExportJSON={handleExportJSON}
        />
      )}

      {/* TAB 4: PLANT SETTINGS & MASTER KEYS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 text-xs flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Configuración General de Planta e Infraestructura</p>
              <p className="text-slate-400 mt-0.5">
                Las contraseñas y NIPs individuales de cada empleado se administran en la pestaña <strong>Empleados</strong>. En esta sección se ajustan las claves maestras de caseta, nombre institucional y el servidor de correo.
              </p>
            </div>
          </div>

          {/* Google Workspace No-Reply Gmail Connection Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-blue-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Servidor de Correo No-Reply (Google Gmail API)</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> OAuth2 Activo
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Envía automáticamente notificaciones reales de citas a las cuentas de correo de visitantes y anfitriones.
                  </p>
                </div>
              </div>

              {gmailToken ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Conectado: {gmailUser?.email || "Cuenta No-Reply"}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await handleDisconnectGmail();
                      handleConnectGmail();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-xl transition-colors font-medium flex items-center gap-1.5 shadow"
                    title="Iniciar sesión con otra cuenta de Google (ej. noreply@dimer.com.mx)"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Cambiar Cuenta de Google</span>
                  </button>
                  <button
                    onClick={handleDisconnectGmail}
                    className="bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-white border border-slate-700 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  disabled={isConnectingGmail}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isConnectingGmail ? "Conectando..." : "Conectar Cuenta Google No-Reply"}</span>
                </button>
              )}
            </div>

            {/* Explanatory note about Google account vs noreply address */}
            <div className="p-3.5 bg-blue-950/50 rounded-xl border border-blue-800/60 text-xs text-blue-200 space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>💡</span> <span>¿Cómo funciona el remitente No-Reply en Google Workspace?</span>
              </p>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                • <strong>Si cuenta con la casilla <code className="bg-blue-900/60 px-1 py-0.5 rounded text-white font-mono">noreply@dimer.com.mx</code> en Google Workspace:</strong> Haga clic en <em>"Cambiar Cuenta de Google"</em> e ingrese con las credenciales de esa cuenta.
              </p>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                • <strong>Si utiliza su cuenta corporativa (<code className="bg-blue-900/60 px-1 py-0.5 rounded text-white font-mono">javier.hernandez@dimer.com.mx</code>):</strong> El sistema envía los correos a través de su cuenta pero con el nombre visible <strong>"{config.noReplySenderName || 'No-Reply Control de Acceso'}"</strong> y dirección de respuesta (Reply-To) hacia <strong>"{config.noReplyEmail || 'noreply@dimer.com.mx'}"</strong>.
              </p>
            </div>

            {connectFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                  connectFeedback.isError
                    ? "bg-rose-950/90 text-rose-200 border-rose-800"
                    : "bg-emerald-950/90 text-emerald-200 border-emerald-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {connectFeedback.isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{connectFeedback.msg}</span>
                </div>
                <button
                  onClick={() => setConnectFeedback(null)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Test Email Delivery Section */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <p className="text-xs font-bold text-blue-200">Prueba de Envío de Correo No-Reply en Tiempo Real:</p>
              
              <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Ingrese un correo destinatario (ej. su correo personal)..."
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!gmailToken && !appsScriptWebhookUrlForm.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                    gmailToken || appsScriptWebhookUrlForm.trim()
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Correo de Prueba</span>
                </button>
              </form>

              {testEmailStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-mono ${
                  testEmailStatus.includes("éxito") ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" :
                  testEmailStatus.includes("Error") ? "bg-rose-950/80 text-rose-300 border border-rose-800" :
                  "bg-blue-950/80 text-blue-300 border border-blue-800"
                }`}>
                  {testEmailStatus}
                </div>
              )}

              {!gmailToken && !appsScriptWebhookUrlForm.trim() && (
                <p className="text-[11px] text-amber-300/80">
                  ℹ️ Haga clic en <strong>"Conectar Cuenta Google No-Reply"</strong> o configure un <strong>Webhook de Google Apps Script</strong> para activar el envío de correos.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PIN Configuration Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Configuración de NIPs de Acceso</span>
              </h3>

              <form onSubmit={handleSavePins} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Nivel Caseta (Guardia de Seguridad)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={guardPinForm}
                    onChange={(e) => setGuardPinForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Nivel Administrador
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={adminPinForm}
                    onChange={(e) => setAdminPinForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Oficial de No Respuesta (No-Reply)
                  </label>
                  <input
                    type="email"
                    required
                    value={noReplyEmailForm}
                    onChange={(e) => setNoReplyEmailForm(e.target.value)}
                    placeholder="no-reply@dimer.com.mx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Dirección que figurará en el remitente de todas las notificaciones automáticas.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre del Remitente Institucional
                  </label>
                  <input
                    type="text"
                    required
                    value={noReplySenderNameForm}
                    onChange={(e) => setNoReplySenderNameForm(e.target.value)}
                    placeholder="No-Reply Control de Acceso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>URL de Webhook Google Apps Script (Opcional - Idéntico a AutoCrat)</span>
                  </label>
                  <input
                    type="url"
                    value={appsScriptWebhookUrlForm}
                    onChange={(e) => setAppsScriptWebhookUrlForm(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Si cuenta con un Webhook de Google Apps Script con <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">MailApp.sendEmail({"{noReply: true}"})</code>, el sistema despachará los correos por ahí de forma 100% nativa.
                  </p>
                </div>

                {pinSuccessMsg && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Configuración y NIPs actualizados correctamente.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Guardar Configuración General
                </button>
              </form>
            </div>

            {/* Backup & Demo Data */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <span>Respaldo de Datos y Demostración</span>
              </h3>

              <p className="text-xs text-slate-500">
                Exporte el contenido completo de la base de datos en formato JSON o restablezca los datos iniciales.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleExportJSON}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 px-4 rounded-xl border border-slate-300 text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Descargar Respaldo JSON Completo</span>
                </button>

                <button
                  onClick={handleSeedData}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold py-2.5 px-4 rounded-xl border border-amber-300 text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>Restaurar / Poblar Anfitriones y Visitantes de Prueba en Firestore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Edit Modal */}
      {(editingVisitor || showVisitorCreateModal) && (
        <VisitorEditModal
          visitor={editingVisitor}
          allVisitors={visitors}
          hosts={hosts}
          onClose={() => {
            setEditingVisitor(null);
            setShowVisitorCreateModal(false);
          }}
          performedBy="Administrador del Sistema"
        />
      )}

      {/* Host Create/Edit Modal */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">
              {editingHost ? "Editar Empleado Anfitrión" : "Agregar Empleado Anfitrión"}
            </h3>

            <form onSubmit={handleSaveHost} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Laura San Román"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol / Permisos de Sistema *</label>
                <select
                  value={hostRole}
                  onChange={(e) => setHostRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="HOST">👤 Anfitrión / Empleado (Recibe y gestiona sus citas)</option>
                  <option value="GUARD">🛡️ Guardia de Seguridad (Operación en Caseta)</option>
                  <option value="ADMIN">👑 Administrador (Acceso total y Auditoría)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="l.sanroman@empresa.com"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Producción / Mantenimiento / RH"
                  value={hostDept}
                  onChange={(e) => setHostDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Puesto / Cargo</label>
                <input
                  type="text"
                  placeholder="Ej. Jefe de Calidad"
                  value={hostPos}
                  onChange={(e) => setHostPos(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña / PIN de Acceso *</label>
                <input
                  type="text"
                  required
                  placeholder="1234"
                  value={hostPin}
                  onChange={(e) => setHostPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-600"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">El empleado usará esta contraseña para acceder con su correo.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Rejection Reason Modal */}
      {rejectVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <span>Rechazar Cita de Visitante (Administración)</span>
            </h3>

            <p className="text-xs text-slate-600">
              Favor de indicar el motivo de rechazo para la solicitud de <strong>{rejectVisitorModal.fullName}</strong> ({rejectVisitorModal.company}):
            </p>

            <div>
              <textarea
                rows={3}
                placeholder="Ej. Incumplimiento de requisitos de seguridad / Documentación vencida"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectVisitorModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRejectVisitor}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
