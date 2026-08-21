import React, { useState } from "react";
import { Visitor, Host } from "../types";
import { formatSpanishDate } from "../lib/utils";
import { sendNoReplyEmailNotification } from "../lib/notifications";
import { getGmailAccessToken, connectGmailAccount } from "../lib/googleAuth";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Check,
  AlertCircle,
  Mail,
  Loader2,
  Eye,
  Lock,
  Building2,
  QrCode,
  ShieldCheck,
  Filter,
  Car,
  Clock,
  Send,
  UserCheck,
  FileCheck
} from "lucide-react";

interface AdminVisitorsTabProps {
  visitors: Visitor[];
  hosts: Host[];
  onOpenCreateModal: () => void;
  onEditVisitor: (visitor: Visitor) => void;
  onDeleteVisitor: (visitor: Visitor) => void;
  onOpenRejectModal: (visitor: Visitor) => void;
  onApproveVisitor: (visitor: Visitor) => void;
}

export const AdminVisitorsTab: React.FC<AdminVisitorsTabProps> = ({
  visitors,
  onOpenCreateModal,
  onEditVisitor,
  onDeleteVisitor,
  onOpenRejectModal,
  onApproveVisitor
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "FUTURE" | "PAST">("ALL");

  const [sendingEmailForId, setSendingEmailForId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const handleResendEmail = async (v: Visitor) => {
    if (!v.email && !v.hostEmail) {
      alert("Este registro no cuenta con correo de visitante ni de anfitrión.");
      return;
    }

    setSendingEmailForId(v.id);
    setEmailFeedback(null);
    try {
      if (!getGmailAccessToken()) {
        const confirmConnect = window.confirm(
          "Para enviar correos automáticos No-Reply, necesita iniciar sesión con su cuenta corporativa de Google. ¿Desea conectarla ahora?"
        );
        if (confirmConnect) {
          await connectGmailAccount();
        } else {
          setSendingEmailForId(null);
          return;
        }
      }

      const eventType = v.status === "APPROVED" ? "APROBACION" : v.status === "REJECTED" ? "RECHAZO" : "SOLICITUD";
      await sendNoReplyEmailNotification(eventType, v);
      setEmailFeedback({
        id: v.id,
        msg: `¡Notificación enviada con éxito a ${v.email || v.hostEmail}!`,
        isError: false
      });
      setTimeout(() => setEmailFeedback(null), 4000);
    } catch (err: any) {
      console.error("Error al reenviar correo:", err);
      setEmailFeedback({
        id: v.id,
        msg: `Error: ${err.message || "No se pudo enviar el correo"}`,
        isError: true
      });
    } finally {
      setSendingEmailForId(null);
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];

  // Filter individual appointments / passes
  const filteredAppointments = visitors.filter((v) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      v.fullName.toLowerCase().includes(term) ||
      v.company.toLowerCase().includes(term) ||
      v.hostName.toLowerCase().includes(term) ||
      v.qrFolio.toLowerCase().includes(term) ||
      (v.badgeNumber && v.badgeNumber.toLowerCase().includes(term)) ||
      (v.vehiclePlates && v.vehiclePlates.toLowerCase().includes(term)) ||
      (v.department && v.department.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      v.status === statusFilter;

    const matchesOrigin =
      originFilter === "ALL" ||
      (originFilter === "EXPRESS" && v.isExpress) ||
      (originFilter === "PREREGISTER" && !v.isExpress);

    const schedDate = v.scheduledDateTime ? v.scheduledDateTime.split("T")[0] : "";
    const matchesDate =
      dateFilter === "ALL" ||
      (dateFilter === "TODAY" && schedDate === todayIso) ||
      (dateFilter === "FUTURE" && schedDate > todayIso) ||
      (dateFilter === "PAST" && schedDate < todayIso);

    return matchesSearch && matchesStatus && matchesOrigin && matchesDate;
  });

  const totalPending = visitors.filter((v) => v.status === "PENDING").length;
  const totalInPlant = visitors.filter((v) => v.status === "CHECKED_IN").length;
  const totalApproved = visitors.filter((v) => v.status === "APPROVED").length;
  const totalExpress = visitors.filter((v) => v.isExpress).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Executive KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Pases</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black">{visitors.length}</p>
            <p className="text-[10px] text-slate-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-900">Por Autorizar</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-amber-950">{totalPending}</p>
            <p className="text-[10px] text-amber-700">Esperando anfitrión / admin</p>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-900">En Planta Activos</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-950">{totalInPlant}</p>
            <p className="text-[10px] text-emerald-700">Check-in activo en caseta</p>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">Aprobadas / Futuras</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-blue-950">{totalApproved}</p>
            <p className="text-[10px] text-blue-700">Con QR listo para ingreso</p>
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-900">Caseta Exprés</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-purple-950">{totalExpress}</p>
            <p className="text-[10px] text-purple-700">Registros directos en caseta</p>
          </div>
        </div>
      </div>

      {/* Email feedback alert */}
      {emailFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            emailFeedback.isError
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {emailFeedback.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{emailFeedback.msg}</span>
          </div>
          <button
            onClick={() => setEmailFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>Control de Citas, Pases y Folios de Acceso</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad individual de visitas programadas y pases de planta. Todos los movimientos quedan auditados con fecha, hora y canal de registro.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenCreateModal}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Generar Nuevo Pase / Cita</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Toolbar */}
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por Visitante, Empresa, Anfitrión, Folio QR, Placas o Gafete..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Canal: Todos</option>
              <option value="EXPRESS">🏢 Caseta (Exprés)</option>
              <option value="PREREGISTER">🌐 Pre-Registro Web</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Estado: Todos</option>
              <option value="PENDING">🟡 Por Autorizar ({totalPending})</option>
              <option value="APPROVED">🔵 Aprobadas</option>
              <option value="CHECKED_IN">🟢 En Planta ({totalInPlant})</option>
              <option value="CHECKED_OUT">⚪ Salida Concluida</option>
              <option value="REJECTED">🔴 Rechazadas</option>
              <option value="CANCELLED">⚠️ Canceladas</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Fecha: Todas</option>
              <option value="TODAY">📅 Para Hoy</option>
              <option value="FUTURE">⏳ Programadas a Futuro</option>
              <option value="PAST">📜 Históricas Pasadas</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Vistas Rápidas:
          </span>
          <button
            onClick={() => { setStatusFilter("ALL"); setOriginFilter("ALL"); setDateFilter("ALL"); setSearchTerm(""); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              statusFilter === "ALL" && originFilter === "ALL" && dateFilter === "ALL" && !searchTerm
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todos ({visitors.length})
          </button>
          <button
            onClick={() => { setStatusFilter("PENDING"); setDateFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-100 text-amber-900 hover:bg-amber-200"
            }`}
          >
            Pendientes ({totalPending})
          </button>
          <button
            onClick={() => { setStatusFilter("CHECKED_IN"); setDateFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              statusFilter === "CHECKED_IN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
            }`}
          >
            En Planta ({totalInPlant})
          </button>
          <button
            onClick={() => { setDateFilter("TODAY"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              dateFilter === "TODAY"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-100 text-blue-900 hover:bg-blue-200"
            }`}
          >
            Citas de Hoy
          </button>
        </div>
      </div>

      {/* APPOINTMENTS & PASSES TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th className="p-3.5 pl-4">Folio QR & Canal</th>
              <th className="p-3.5">Visitante / Organización</th>
              <th className="p-3.5">Anfitrión / Área</th>
              <th className="p-3.5">Fecha Programada</th>
              <th className="p-3.5">Estado Operativo</th>
              <th className="p-3.5">Gafete / Vehículo</th>
              <th className="p-3.5 pr-4 text-right">Acciones de Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No se encontraron citas ni pases</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pruebe ajustando los filtros o genere un nuevo pase.</p>
                </td>
              </tr>
            ) : (
              filteredAppointments.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-3.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-900 text-[12px]">{v.qrFolio}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 border ${
                          v.isExpress
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          {v.isExpress ? "🏢 Caseta (Exprés)" : "🌐 Pre-Registro"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 text-sm">{v.fullName}</p>
                    <p className="text-slate-500 font-medium text-[11px] flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{v.company || "Particular"}</span>
                    </p>
                    {v.email && (
                      <p className="text-slate-400 text-[10px] truncate max-w-[180px]">{v.email}</p>
                    )}
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-900">{v.hostName}</p>
                    <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium mt-0.5">
                      {v.department || "Planta"}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">{formatSpanishDate(v.scheduledDateTime)}</span>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                      v.status === 'APPROVED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      v.status === 'PENDING' ? 'bg-amber-50 text-amber-900 border-amber-200 animate-pulse' :
                      v.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-black' :
                      v.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      v.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        v.status === 'APPROVED' ? 'bg-blue-600' :
                        v.status === 'PENDING' ? 'bg-amber-500' :
                        v.status === 'CHECKED_IN' ? 'bg-emerald-600' :
                        v.status === 'CHECKED_OUT' ? 'bg-slate-400' :
                        v.status === 'REJECTED' ? 'bg-rose-600' : 'bg-slate-400'
                      }`} />
                      {v.status === 'APPROVED' ? 'Aprobada' :
                       v.status === 'PENDING' ? 'Por Autorizar' :
                       v.status === 'CHECKED_IN' ? 'En Planta' :
                       v.status === 'CHECKED_OUT' ? 'Salida Concluida' :
                       v.status === 'REJECTED' ? 'Rechazada' : 'Cancelada'}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-1">
                      {v.badgeNumber ? (
                        <div className="inline-flex items-center gap-1 font-mono bg-amber-100 text-amber-950 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-300">
                          <span>Gafete:</span>
                          <span>{v.badgeNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Sin gafete</span>
                      )}

                      {v.vehiclePlates && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                          <Car className="w-3 h-3 text-slate-400" />
                          <span>{v.vehiclePlates}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Send / Resend Email button */}
                      <button
                        onClick={() => handleResendEmail(v)}
                        disabled={sendingEmailForId === v.id}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-blue-200"
                        title="Reenviar Notificación por Correo No-Reply"
                      >
                        {sendingEmailForId === v.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>

                      {v.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => onApproveVisitor(v)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                            title="Aprobar Cita de Inmediato"
                          >
                            <Check className="w-4 h-4 font-bold" />
                          </button>
                          <button
                            onClick={() => onOpenRejectModal(v)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                            title="Rechazar Cita"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {v.status === 'REJECTED' || v.status === 'CANCELLED' ? (
                        <button
                          onClick={() => onEditVisitor(v)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Ver Registro Finalizado (Inmutable)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onEditVisitor(v)}
                          className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-200"
                          title={v.status === 'APPROVED' || v.status === 'CHECKED_IN' ? 'Ver / Asignar Gafete' : 'Editar Cita'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteVisitor(v)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Eliminar Registro de Pase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

