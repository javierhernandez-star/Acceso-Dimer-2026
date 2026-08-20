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
  Lock
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
        msg: `¡Notificación enviada a ${v.email || v.hostEmail}!`,
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
      (v.vehiclePlates && v.vehiclePlates.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      v.status === statusFilter;

    const matchesOrigin =
      originFilter === "ALL" ||
      (originFilter === "EXPRESS" && v.isExpress) ||
      (originFilter === "PREREGISTER" && !v.isExpress);

    return matchesSearch && matchesStatus && matchesOrigin;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Citas</p>
          <p className="text-2xl font-black text-slate-900">{visitors.length}</p>
          <p className="text-[10px] text-slate-400">Pases y citas registrados</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pendientes de Aprobación</p>
          <p className="text-2xl font-black text-amber-950">
            {visitors.filter((v) => v.status === "PENDING").length}
          </p>
          <p className="text-[10px] text-amber-700">Por autorizar por anfitrión o admin</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Caseta (Exprés)</p>
          <p className="text-2xl font-black text-blue-900">
            {visitors.filter((v) => v.isExpress).length}
          </p>
          <p className="text-[10px] text-blue-600">Registrados directo en caseta</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Pre-Registros Web</p>
          <p className="text-2xl font-black text-emerald-900">
            {visitors.filter((v) => !v.isExpress).length}
          </p>
          <p className="text-[10px] text-emerald-600">Generados desde portal web</p>
        </div>
      </div>

      {/* Email feedback alert */}
      {emailFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>Gestión de Citas y Pases de Acceso ({visitors.length} Registradas)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Administre las solicitudes, pre-registros web y pases de acceso generados. Eliminar una cita aquí cancela la visita específica pero <strong>mantiene intacta a la persona en el Padrón de Visitantes</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nueva Cita / Pase</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por Visitante, Empresa, Anfitrión, Folio QR o Placas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">🏢 Origen: Todos</option>
            <option value="EXPRESS">⚡ Caseta (Exprés)</option>
            <option value="PREREGISTER">🌐 Pre-Registro Web</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">Estado: Todos</option>
            <option value="PENDING">🟡 Pendientes</option>
            <option value="APPROVED">🔵 Aprobadas</option>
            <option value="CHECKED_IN">🟢 En Planta</option>
            <option value="CHECKED_OUT">⚪ Salida</option>
            <option value="REJECTED">🔴 Rechazadas</option>
            <option value="CANCELLED">⚠️ Canceladas</option>
          </select>
        </div>
      </div>

      {/* APPOINTMENTS & PASSES TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Folio QR / Canal</th>
              <th className="p-3">Visitante / Empresa</th>
              <th className="p-3">Anfitrión / Depto</th>
              <th className="p-3">Fecha Programada</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Gafete / Placas</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No se encontraron citas o pases con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-mono font-bold text-amber-800">{v.qrFolio}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 ${
                      v.isExpress
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {v.isExpress ? "🏢 Caseta (Exprés)" : "🌐 Pre-Registro"}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{v.fullName}</p>
                    <p className="text-slate-500 text-[11px]">{v.company}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-slate-800">{v.hostName}</p>
                    <p className="text-[10px] text-slate-400">{v.department}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{formatSpanishDate(v.scheduledDateTime)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                      v.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      v.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      v.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      v.status === 'CHECKED_OUT' ? 'bg-slate-200 text-slate-700 border-slate-300' :
                      v.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {v.status === 'APPROVED' ? '🔵 Aprobada' :
                       v.status === 'PENDING' ? '🟡 Pendiente' :
                       v.status === 'CHECKED_IN' ? '🟢 En Planta' :
                       v.status === 'CHECKED_OUT' ? '⚪ Salida' :
                       v.status === 'REJECTED' ? '🔴 Rechazada' :
                       '⚠️ Cancelada'}
                    </span>
                  </td>
                  <td className="p-3">
                    {v.badgeNumber ? (
                      <span className="font-mono bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-bold border border-amber-300">
                        {v.badgeNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Sin gafete</span>
                    )}
                    {v.vehiclePlates && (
                      <p className="font-mono text-[10px] text-slate-600 mt-0.5">🚗 {v.vehiclePlates}</p>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    {/* Send / Resend Email button */}
                    <button
                      onClick={() => handleResendEmail(v)}
                      disabled={sendingEmailForId === v.id}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Enviar / Reenviar Correo No-Reply a Visitante y Anfitrión"
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
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aprobar Cita"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenRejectModal(v)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Rechazar Cita"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {v.status === 'REJECTED' || v.status === 'CANCELLED' ? (
                      <button
                        onClick={() => onEditVisitor(v)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Ver Registro Finalizado (Inmutable)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onEditVisitor(v)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={v.status === 'APPROVED' || v.status === 'CHECKED_IN' ? 'Ver / Asignar Gafete (Datos Bloqueados)' : 'Editar Cita'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteVisitor(v)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Registro de Cita"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
