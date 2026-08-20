import React, { useState } from "react";
import { Visitor, Host, AppConfig } from "../types";
import { updateVisitorStatus, addVisitor, deleteVisitor, getAvailableBadgeNumber } from "../lib/firebase";
import { formatSpanishDate, formatSpanishTime, generateQRFolio } from "../lib/utils";
import { QRScannerModal } from "./QRScannerModal";
import { DigitalPassModal } from "./DigitalPassModal";
import { VisitorEditModal } from "./VisitorEditModal";
import { HostCardModal } from "./HostCardModal";
import { GuardVisitorDetailModal } from "./GuardVisitorDetailModal";
import {
  Shield, KeyRound, Search, QrCode, CheckCircle2, LogOut, UserPlus,
  Clock, AlertCircle, Building2, User, Phone, Check, RefreshCw,
  Edit2, Trash2, Contact, Mail, Users, Eye, LayoutGrid, List
} from "lucide-react";

import { ActiveUserSession } from "./Header";

interface GuardPanelProps {
  visitors: Visitor[];
  hosts: Host[];
  config: AppConfig;
  currentUser?: ActiveUserSession;
}

export const GuardPanel: React.FC<GuardPanelProps> = ({ visitors, hosts, config, currentUser }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'GUARD')
  );
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modals & Action States
  const [selectedVisitorForCheckIn, setSelectedVisitorForCheckIn] = useState<Visitor | null>(null);
  const [selectedVisitorForDetail, setSelectedVisitorForDetail] = useState<Visitor | null>(null);
  const [badgeNumberInput, setBadgeNumberInput] = useState("");
  
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [showHostsModal, setShowHostsModal] = useState(false);
  const [selectedHostForCard, setSelectedHostForCard] = useState<Host | null>(null);
  const [viewPassVisitor, setViewPassVisitor] = useState<Visitor | null>(null);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [checkoutVisitorModal, setCheckoutVisitorModal] = useState<Visitor | null>(null);
  const [deleteVisitorModal, setDeleteVisitorModal] = useState<Visitor | null>(null);

  // Express Registration Form
  const [expressName, setExpressName] = useState("");
  const [expressCompany, setExpressCompany] = useState("");
  const [expressEmail, setExpressEmail] = useState("");
  const [expressPhone, setExpressPhone] = useState("");
  const [expressIdNumber, setExpressIdNumber] = useState("");
  const [expressHostId, setExpressHostId] = useState(hosts[0]?.id || "");
  const [expressBadge, setExpressBadge] = useState("");
  const [isSubmittingExpress, setIsSubmittingExpress] = useState(false);

  // Handle PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === config.guardPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  // Filter Visitors
  const filteredVisitors = visitors.filter((v) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      v.fullName.toLowerCase().includes(term) ||
      v.company.toLowerCase().includes(term) ||
      v.qrFolio.toLowerCase().includes(term) ||
      v.idNumber.toLowerCase().includes(term) ||
      (v.badgeNumber && v.badgeNumber.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Prepare Check-In Modal with Auto Badge Assignment
  const handleOpenCheckInModal = (v: Visitor) => {
    setSelectedVisitorForCheckIn(v);
    const autoBadge = getAvailableBadgeNumber(v.accessType, visitors);
    setBadgeNumberInput(autoBadge);
  };

  // Check-In Execution
  const handleConfirmCheckIn = async () => {
    if (!selectedVisitorForCheckIn) return;
    if (!badgeNumberInput.trim()) {
      alert("Por favor asigne un número de gafete para la visita.");
      return;
    }

    try {
      await updateVisitorStatus(
        selectedVisitorForCheckIn.id,
        {
          status: "CHECKED_IN",
          badgeNumber: badgeNumberInput.trim().toUpperCase(),
          checkInTime: new Date().toISOString()
        },
        "Guardia de Seguridad (Caseta)",
        "CHECK_IN",
        `Ingreso autorizado. Gafete asignado: ${badgeNumberInput.toUpperCase()}`
      );
      setSelectedVisitorForCheckIn(null);
      setBadgeNumberInput("");
    } catch (err) {
      console.error("Error confirming check-in:", err);
      alert("Error al procesar la entrada.");
    }
  };

  // Check-Out Execution (Modal)
  const handleConfirmCheckOut = async () => {
    if (!checkoutVisitorModal) return;

    try {
      await updateVisitorStatus(
        checkoutVisitorModal.id,
        {
          status: "CHECKED_OUT",
          checkOutTime: new Date().toISOString()
        },
        "Guardia de Seguridad (Caseta)",
        "CHECK_OUT",
        `Salida registrada y gafete ${checkoutVisitorModal.badgeNumber || "N/A"} liberado.`
      );
      setCheckoutVisitorModal(null);
    } catch (err) {
      console.error("Error processing check-out:", err);
      alert("Error al registrar la salida.");
    }
  };

  // Delete Visitor (Modal)
  const handleConfirmDeleteVisitor = async () => {
    if (!deleteVisitorModal) return;

    try {
      await deleteVisitor(deleteVisitorModal.id, "Guardia de Seguridad", `Registro eliminado manualmente desde Caseta.`);
      setDeleteVisitorModal(null);
    } catch (err) {
      console.error("Error deleting visitor:", err);
      alert("Error al eliminar el registro.");
    }
  };

  // Prepare Express Modal with Auto Badge
  const handleOpenExpressModal = () => {
    const autoBadge = getAvailableBadgeNumber("Visita General", visitors);
    setExpressBadge(autoBadge);
    setShowExpressModal(true);
  };

  // Submit Express Walk-In Registration
  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expressName || !expressCompany || !expressHostId || !expressBadge) {
      alert("Complete los campos obligatorios para el registro express.");
      return;
    }

    setIsSubmittingExpress(true);
    try {
      const selectedHost = hosts.find((h) => h.id === expressHostId) || hosts[0];
      const now = new Date().toISOString();
      const folio = generateQRFolio();

      const newVisitorData: Omit<Visitor, "id"> = {
        fullName: expressName.trim(),
        company: expressCompany.trim(),
        email: expressEmail.trim() || "express@visitante.local",
        phone: expressPhone.trim() || "0000000000",
        idType: "INE",
        idNumber: expressIdNumber.trim() || "EXPRESS-WALKIN",
        accessType: "Visita General",
        hostId: selectedHost ? selectedHost.id : "general",
        hostName: selectedHost ? selectedHost.fullName : "Anfitrión",
        hostEmail: selectedHost ? selectedHost.email : "",
        department: selectedHost ? selectedHost.department : "Planta",
        zone: "Planta Principal",
        scheduledDateTime: now,
        healthDeclaration: true,
        status: "CHECKED_IN",
        badgeNumber: expressBadge.trim().toUpperCase(),
        checkInTime: now,
        qrFolio: folio,
        createdAt: now,
        updatedAt: now,
        isExpress: true,
        isExternal: false
      };

      await addVisitor(newVisitorData);
      setShowExpressModal(false);
      // Reset form
      setExpressName("");
      setExpressCompany("");
      setExpressEmail("");
      setExpressPhone("");
      setExpressIdNumber("");
    } catch (err) {
      console.error("Error in express registration:", err);
      alert("Ocurrió un error al registrar la visita express.");
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  // Active visitors currently in plant
  const visitorsInPlant = visitors.filter((v) => v.status === "CHECKED_IN");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar Controls */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-500/30 text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Control de Caseta de Vigilancia</h2>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {visitorsInPlant.length} En Planta
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Validación de Pases QR, Asignación de Gafetes y Registro Express
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowQRScannerModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Escanear QR</span>
          </button>

          <button
            onClick={handleOpenExpressModal}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registro Express</span>
          </button>

          <button
            onClick={() => setShowHostsModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors"
          >
            <Contact className="w-4 h-4" />
            <span>Anfitriones ({hosts.length})</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Bloquear Caseta"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Citas Hoy</p>
            <p className="text-2xl font-black text-slate-900">{visitors.length}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Aprobadas</p>
            <p className="text-2xl font-black text-emerald-600">
              {visitors.filter((v) => v.status === "APPROVED").length}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Actualmente Dentro</p>
            <p className="text-2xl font-black text-blue-600">{visitorsInPlant.length}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Salidas Hoy</p>
            <p className="text-2xl font-black text-slate-700">
              {visitors.filter((v) => v.status === "CHECKED_OUT").length}
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <LogOut className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por Nombre, Empresa, Folio QR, ID / INE o Número de Gafete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
          />
        </div>

        {/* Professional Filter Tabs with Counters & View Switcher */}
        <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "ALL", label: "Todas las Citas", count: visitors.length },
              { id: "CHECKED_IN", label: "🏢 En Planta", count: visitorsInPlant.length },
              { id: "APPROVED", label: "✅ Aprobadas", count: visitors.filter((v) => v.status === "APPROVED").length },
              { id: "PENDING", label: "⏳ Pendientes", count: visitors.filter((v) => v.status === "PENDING").length },
              { id: "CHECKED_OUT", label: "🚪 Salidas", count: visitors.filter((v) => v.status === "CHECKED_OUT").length }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === f.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  statusFilter === f.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista en Tarjetas Interactivas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista en Lista Detallada"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visitor List / Interactive Grid */}
      <div className="space-y-4">
        {filteredVisitors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Sin registros para esta vista</p>
            <p className="text-xs text-slate-400">Seleccione la pestaña 'Todas las Citas' o intente con un criterio de búsqueda distinto.</p>
          </div>
        ) : viewMode === "cards" ? (
          /* INTERACTIVE COMPACT PREVIEW CARDS GRID FOR GUARD PANEL */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisitors.map((v) => {
              const isCheckedIn = v.status === "CHECKED_IN";
              const isApproved = v.status === "APPROVED";
              const isPending = v.status === "PENDING";
              const isCheckedOut = v.status === "CHECKED_OUT";

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVisitorForDetail(v)}
                  className={`bg-white hover:bg-slate-50/90 border p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group min-w-0 break-words ${
                    isCheckedIn
                      ? "border-blue-400 ring-2 ring-blue-500/20"
                      : isApproved
                      ? "border-emerald-400"
                      : "border-slate-200"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Badges & Folio */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isCheckedIn
                            ? "bg-blue-100 text-blue-900 border-blue-300"
                            : isApproved
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : isPending
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : isCheckedOut
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-rose-100 text-rose-900 border-rose-300"
                        }`}>
                          {isCheckedIn
                            ? "🏢 En Planta"
                            : isApproved
                            ? "✅ Aprobada"
                            : isPending
                            ? "⏳ Pendiente"
                            : isCheckedOut
                            ? "🚪 Salida"
                            : "Rechazado"}
                        </span>

                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200 truncate">
                          {v.qrFolio}
                        </span>
                      </div>

                      {v.badgeNumber && (
                        <span className="bg-blue-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm shrink-0">
                          🏷️ #{v.badgeNumber}
                        </span>
                      )}
                    </div>

                    {/* Visitor Title & Company */}
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors truncate">
                        {v.fullName}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{v.company}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 text-[11px] truncate">{v.accessType || "Visita"}</span>
                      </p>
                    </div>

                    {/* Compact Preview Summary */}
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Anfitrión:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]" title={`${v.hostName} (${v.department})`}>
                          👤 {v.hostName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Cita / Horario:</span>
                        <span className="font-semibold text-slate-700 text-[11px] truncate">
                          🕒 {formatSpanishDate(v.scheduledDateTime || v.createdAt)}
                        </span>
                      </div>

                      {(v.vehiclePlates || ((v.companions && v.companions.length > 0) || (v.companionCount && v.companionCount > 0))) && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          {v.vehiclePlates ? (
                            <span className="font-mono font-bold text-slate-700">
                              🚗 {v.vehiclePlates}
                            </span>
                          ) : (
                            <span className="text-slate-400">Peatonal</span>
                          )}

                          {((v.companions && v.companions.length > 0) || (v.companionCount && v.companionCount > 0)) && (
                            <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                              👥 +{v.companions?.length || v.companionCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Operational Actions */}
                  <div className="border-t border-slate-100 pt-2.5 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setSelectedVisitorForDetail(v)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 px-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        title="Ver detalle completo"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver Ficha</span>
                      </button>

                      <button
                        onClick={() => setViewPassVisitor(v)}
                        className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-colors border border-slate-200"
                        title="Ver Pase QR"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => setEditingVisitor(v)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl transition-colors border border-slate-200"
                        title="Editar Registro"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>

                    {/* Primary Action Button */}
                    {isApproved && (
                      <button
                        onClick={() => handleOpenCheckInModal(v)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 tracking-wide uppercase"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>REGISTRAR ENTRADA</span>
                      </button>
                    )}

                    {isCheckedIn && (
                      <button
                        onClick={() => setCheckoutVisitorModal(v)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 tracking-wide uppercase"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>REGISTRAR SALIDA</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW WITH CLICKABLE ROWS */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredVisitors.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVisitorForDetail(v)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-transparent hover:border-l-blue-600 cursor-pointer"
              >
                {/* Left: Visitor Details */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-base">{v.fullName}</span>
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                      Folio: {v.qrFolio}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded uppercase">
                      {v.accessType}
                    </span>
                    {v.isExpress && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                        ⚡ Walk-In Express
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {v.company}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const hostObj = hosts.find((h) => h.id === v.hostId || h.fullName === v.hostName);
                        if (hostObj) {
                          setSelectedHostForCard(hostObj);
                        } else {
                          setSelectedHostForCard({
                            id: v.hostId || "temp",
                            fullName: v.hostName,
                            email: v.hostEmail || "sin-correo@empresa.com",
                            phone: "N/A",
                            department: v.department || "Planta Principal",
                            position: "Anfitrión Asignado",
                            status: "ACTIVE"
                          });
                        }
                      }}
                      className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors font-bold text-xs border border-indigo-200/60"
                      title="Ver tarjeta completa del anfitrión"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-600" /> Anfitrión: <u>{v.hostName}</u> ({v.department})
                    </button>

                    <span className="text-slate-500 font-medium">
                      🆔 {v.idType || "INE"}: <span className="font-mono text-slate-800 font-bold">{v.idNumber}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                    <span>📅 Cita: {formatSpanishDate(v.scheduledDateTime)}</span>
                    {v.checkInTime && (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entrada: {formatSpanishTime(v.checkInTime)}
                      </span>
                    )}
                    {v.checkOutTime && (
                      <span className="text-slate-600 font-bold">
                        🚪 Salida: {formatSpanishTime(v.checkOutTime)}
                      </span>
                    )}
                    {v.badgeNumber && (
                      <span className="bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded border border-blue-300 font-mono">
                        🏷️ Gafete: {v.badgeNumber}
                      </span>
                    )}
                    {(v.companions && v.companions.length > 0) || (v.companionCount && v.companionCount > 0) ? (
                      <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-700" /> Acompañantes: {v.companions?.length || v.companionCount}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedVisitorForDetail(v)}
                    className="p-2 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 border border-slate-200"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Detalle</span>
                  </button>

                  <button
                    onClick={() => setViewPassVisitor(v)}
                    className="p-2 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 border border-slate-200"
                    title="Ver Pase Digital QR"
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Ver Pase</span>
                  </button>

                  <button
                    onClick={() => setEditingVisitor(v)}
                    className="p-2 text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 border border-slate-200"
                    title="Editar Registro / Acompañantes"
                  >
                    <Edit2 className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    onClick={() => setDeleteVisitorModal(v)}
                    className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold border border-slate-200"
                    title="Eliminar Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Context Actions */}
                  {v.status === "APPROVED" ? (
                    <button
                      onClick={() => handleOpenCheckInModal(v)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar Entrada</span>
                    </button>
                  ) : v.status === "PENDING" ? (
                    <div
                      className="bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5"
                      title="Esperando confirmación del anfitrión"
                    >
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span>Pendiente Anfitrión</span>
                    </div>
                  ) : v.status === "CHECKED_IN" ? (
                    <button
                      onClick={() => setCheckoutVisitorModal(v)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Registrar Salida</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-bold px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">
                      {v.status === "CHECKED_OUT" ? "Salida Completada" : "Rechazado"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Host Directory Modal */}
      {showHostsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Contact className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Directorio de Anfitriones</h3>
              </div>
              <button
                onClick={() => setShowHostsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {hosts.map((h) => (
                <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{h.fullName}</h4>
                    <p className="text-slate-500">{h.department} - {h.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-slate-600">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> Ext. {h.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {h.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedHostForCard(h);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-lg flex items-center gap-1"
                      title="Ver Ficha y Estadísticas"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                    <a
                      href={`tel:${h.phone}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Llamar</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right shrink-0">
              <button
                onClick={() => setShowHostsModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Cerrar Directorio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Modal with Badge Assignment */}
      {selectedVisitorForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Confirmar Entrada (Check-In)</span>
              </h3>
              <button
                onClick={() => setSelectedVisitorForCheckIn(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200 text-xs">
              <p><strong>Visitante:</strong> {selectedVisitorForCheckIn.fullName}</p>
              <p><strong>Empresa:</strong> {selectedVisitorForCheckIn.company}</p>
              <p><strong>Anfitrión:</strong> {selectedVisitorForCheckIn.hostName} ({selectedVisitorForCheckIn.department})</p>
              <p><strong>Identificación:</strong> {selectedVisitorForCheckIn.idType} - {selectedVisitorForCheckIn.idNumber}</p>
              <p><strong>Folio:</strong> <span className="font-mono font-bold text-blue-900">{selectedVisitorForCheckIn.qrFolio}</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Asignar Número de Gafete * (Automático)
              </label>
              <input
                type="text"
                value={badgeNumberInput}
                onChange={(e) => setBadgeNumberInput(e.target.value)}
                placeholder="Ej. G-102"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedVisitorForCheckIn(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCheckIn}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Autorizar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Express Walk-in Modal with Complete Registration Fields */}
      {showExpressModal && (
        <VisitorEditModal
          visitor={null}
          allVisitors={visitors}
          hosts={hosts}
          onClose={() => setShowExpressModal(false)}
          actorName="Guardia de Seguridad (Registro Exprés en Caseta)"
        />
      )}

      {/* Edit Visitor Modal */}
      {editingVisitor && (
        <VisitorEditModal
          visitor={editingVisitor}
          allVisitors={visitors}
          hosts={hosts}
          onClose={() => setEditingVisitor(null)}
          actorName="Guardia de Seguridad"
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScannerModal && (
        <QRScannerModal
          visitors={visitors}
          onScanSuccess={(scannedVisitor) => {
            setViewPassVisitor(scannedVisitor);
          }}
          onClose={() => setShowQRScannerModal(false)}
        />
      )}

      {/* Pass View Modal */}
      {viewPassVisitor && (
        <DigitalPassModal
          visitor={viewPassVisitor}
          onClose={() => setViewPassVisitor(null)}
        />
      )}

      {/* Host Card Detail Modal */}
      {selectedHostForCard && (
        <HostCardModal
          host={selectedHostForCard}
          visitors={visitors}
          onClose={() => setSelectedHostForCard(null)}
        />
      )}

      {/* Checkout Confirmation Modal */}
      {checkoutVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
              <LogOut className="w-5 h-5" />
              <span>Confirmar Salida de Planta</span>
            </h3>

            <p className="text-xs text-slate-600">
              ¿Confirmar salida del visitante <strong>{checkoutVisitorModal.fullName}</strong> ({checkoutVisitorModal.company})?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p>🏷️ <strong>Gafete Asignado:</strong> <span className="font-mono font-bold text-blue-900">{checkoutVisitorModal.badgeNumber || "N/A"}</span></p>
              <p className="text-emerald-700 font-semibold">El gafete quedará liberado automáticamente para la siguiente visita.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCheckoutVisitorModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCheckOut}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Registrar Salida Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <span>Eliminar Registro de Visitante</span>
            </h3>

            <p className="text-xs text-slate-600">
              ¿Está seguro de eliminar el expediente de <strong>{deleteVisitorModal.fullName}</strong> ({deleteVisitorModal.company})? Esta acción eliminará el folio <span className="font-mono font-bold">{deleteVisitorModal.qrFolio}</span> de la base de datos.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteVisitorModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteVisitor}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Guard Visitor Full Detail Modal */}
      {selectedVisitorForDetail && (
        <GuardVisitorDetailModal
          visitor={selectedVisitorForDetail}
          hosts={hosts}
          onClose={() => setSelectedVisitorForDetail(null)}
          onCheckIn={(v) => {
            setSelectedVisitorForDetail(null);
            handleOpenCheckInModal(v);
          }}
          onCheckOut={(v) => {
            setSelectedVisitorForDetail(null);
            setCheckoutVisitorModal(v);
          }}
          onViewPass={(v) => {
            setSelectedVisitorForDetail(null);
            setViewPassVisitor(v);
          }}
          onEdit={(v) => {
            setSelectedVisitorForDetail(null);
            setEditingVisitor(v);
          }}
          onSelectHost={(h) => {
            setSelectedVisitorForDetail(null);
            setSelectedHostForCard(h);
          }}
        />
      )}
    </div>
  );
};

