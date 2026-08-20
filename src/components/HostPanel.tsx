import React, { useState } from "react";
import { Visitor, Host } from "../types";
import { updateVisitorStatus } from "../lib/firebase";
import { sendNoReplyEmailNotification } from "../lib/notifications";
import { formatSpanishDate, generateHostDecisionMailto } from "../lib/utils";
import { GuardVisitorDetailModal } from "./GuardVisitorDetailModal";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building,
  Eye,
  AlertTriangle
} from "lucide-react";

import { ActiveUserSession } from "./Header";

interface HostPanelProps {
  visitors: Visitor[];
  hosts: Host[];
  currentUser?: ActiveUserSession;
}

export const HostPanel: React.FC<HostPanelProps> = ({ visitors, hosts, currentUser }) => {
  // Find host matching logged in user by id or email
  const matchedHostUser = hosts.find(
    (h) => (currentUser?.id && h.id === currentUser.id) || (currentUser?.email && h.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const initialHostId = matchedHostUser ? matchedHostUser.id : (hosts[0]?.id || "");

  const [selectedHostId, setSelectedHostId] = useState<string>(initialHostId);
  const [selectedVisitorForDetail, setSelectedVisitorForDetail] = useState<Visitor | null>(null);

  // Rejection modal state
  const [rejectVisitorModal, setRejectVisitorModal] = useState<Visitor | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Cancellation modal state
  const [cancelVisitorModal, setCancelVisitorModal] = useState<Visitor | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";
  const activeHostId = isAdmin ? selectedHostId : (matchedHostUser?.id || selectedHostId);
  const currentHost = hosts.find((h) => h.id === activeHostId) || hosts[0];

  // Filter pending appointments for this host
  const pendingForHost = visitors.filter((v) => {
    if (v.status !== "PENDING") return false;
    if (isAdmin && activeHostId === "ALL") return true;
    return (
      v.hostId === activeHostId ||
      (!v.hostId && v.hostName?.toLowerCase() === currentHost?.fullName?.toLowerCase()) ||
      (v.hostEmail && currentHost?.email && v.hostEmail.toLowerCase() === currentHost.email.toLowerCase()) ||
      (v.hostName && currentHost?.fullName && v.hostName.toLowerCase() === currentHost.fullName.toLowerCase())
    );
  });

  const historyForHost = visitors.filter((v) => {
    if (v.status === "PENDING") return false;
    if (isAdmin && activeHostId === "ALL") return true;
    return (
      v.hostId === activeHostId ||
      (!v.hostId && v.hostName?.toLowerCase() === currentHost?.fullName?.toLowerCase()) ||
      (v.hostEmail && currentHost?.email && v.hostEmail.toLowerCase() === currentHost.email.toLowerCase()) ||
      (v.hostName && currentHost?.fullName && v.hostName.toLowerCase() === currentHost.fullName.toLowerCase())
    );
  });

  // Approve appointment
  const handleApprove = async (visitor: Visitor) => {
    try {
      await updateVisitorStatus(
        visitor.id,
        { status: "APPROVED" },
        currentHost ? currentHost.fullName : "Anfitrión",
        "APPROVE",
        `Cita aprobada por anfitrión ${currentHost?.fullName || ''}.`
      );

      // Trigger Google No-Reply Email Notification in background
      sendNoReplyEmailNotification("APROBACION", {
        ...visitor,
        status: "APPROVED"
      }).catch(() => {});

      // Trigger mailto notification safely as fallback
      try {
        const mailUrl = generateHostDecisionMailto(visitor, "APPROVED");
        window.open(mailUrl, "_blank");
      } catch (e) {
        console.warn("Mailto popup prevented:", e);
      }
    } catch (err) {
      console.error("Error approving appointment:", err);
      alert("No se pudo aprobar la cita.");
    }
  };

  // Reject appointment
  const handleConfirmReject = async () => {
    if (!rejectVisitorModal) return;
    const reason = rejectionReasonInput.trim() || "Conflicto de agenda del anfitrión";

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
        currentHost ? currentHost.fullName : "Anfitrión",
        "REJECT",
        `Cita rechazada por anfitrión ${currentHost?.fullName || ''}. Motivo: ${reason}`
      );

      // Trigger Google No-Reply Email Notification in background
      sendNoReplyEmailNotification("RECHAZO", updatedVisitor, reason).catch(() => {});

      // Trigger mailto notification safely
      try {
        const mailUrl = generateHostDecisionMailto(rejectVisitorModal, "REJECTED", reason);
        window.open(mailUrl, "_blank");
      } catch (e) {
        console.warn("Mailto popup prevented:", e);
      }

      setRejectVisitorModal(null);
      setRejectionReasonInput("");
    } catch (err) {
      console.error("Error rejecting appointment:", err);
      alert("No se pudo registrar el rechazo.");
    }
  };

  // Cancel appointment via Modal
  const handleConfirmCancel = async () => {
    if (!cancelVisitorModal) return;
    const reason = cancellationReasonInput.trim() || "Cita cancelada por anfitrión";

    try {
      const updatedVisitor: Visitor = {
        ...cancelVisitorModal,
        status: "CANCELLED",
        cancellationReason: reason
      };

      await updateVisitorStatus(
        cancelVisitorModal.id,
        {
          status: "CANCELLED",
          cancellationReason: reason
        },
        currentHost ? currentHost.fullName : "Anfitrión",
        "CANCEL",
        `Cita cancelada por anfitrión ${currentHost?.fullName || ''}. Motivo: ${reason}`
      );

      // Trigger Google No-Reply Email Notification in background
      sendNoReplyEmailNotification("CANCELACION", updatedVisitor, reason).catch(() => {});

      // Trigger mailto notification safely
      try {
        const mailUrl = generateHostDecisionMailto(cancelVisitorModal, "CANCELLED", reason);
        window.open(mailUrl, "_blank");
      } catch (e) {
        console.warn("Mailto popup prevented:", e);
      }

      setCancelVisitorModal(null);
      setCancellationReasonInput("");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("No se pudo cancelar la cita.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Host Top Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-300">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAdmin ? "Bandeja de Aprobaciones — Modo Administrador" : `Bandeja de Aprobaciones — ${currentHost?.fullName || 'Anfitrión'}`}
            </h2>
            <p className="text-xs text-slate-300">
              {isAdmin 
                ? "Como Administrador puede autorizar o gestionar citas de cualquier anfitrión."
                : `Gestione y autorice las citas solicitadas para ${currentHost?.department || 'su área'}.`}
            </p>
          </div>
        </div>

        {/* If Admin, allow selecting which Host's queue to inspect */}
        {isAdmin ? (
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 px-3 rounded-xl border border-slate-700">
            <label className="text-xs font-bold text-slate-300">Anfitrión:</label>
            <select
              value={selectedHostId}
              onChange={(e) => setSelectedHostId(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🌟 Todos los Anfitriones (Vista Global)</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.fullName} ({h.department})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentHost?.fullName} ({currentHost?.department})</span>
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Buzón de Solicitudes Pendientes de Aprobación
            </h3>
          </div>
          <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full border border-amber-300">
            {pendingForHost.length} {pendingForHost.length === 1 ? "Pendiente" : "Pendientes"}
          </span>
        </div>

        {pendingForHost.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Sin citas pendientes</p>
            <p className="text-xs text-slate-400">
              Todas las visitas dirigidas a {currentHost?.fullName || "usted"} están al día.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingForHost.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVisitorForDetail(v)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer min-w-0 break-words"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-sm sm:text-base">{v.fullName}</span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {v.company}
                    </span>
                    <span className="font-mono text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 font-bold">
                      {v.qrFolio}
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                      {v.accessType}
                    </span>
                  </div>

                  {/* Compact Info Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      🕒 {formatSpanishDate(v.scheduledDateTime || v.createdAt)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>📍 Zona: <strong className="text-slate-800">{v.zone || "General"}</strong></span>
                    {v.idNumber && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>🆔 <strong className="text-slate-800 font-mono">{v.idType || "ID"}: {v.idNumber}</strong></span>
                      </>
                    )}
                  </div>

                  {v.healthDeclaration && (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Declaración médica y protocolo de seguridad aceptados.</span>
                    </p>
                  )}
                </div>

                {/* Approve / Reject / Detail buttons */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleApprove(v)}
                    className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-colors uppercase tracking-wide"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar</span>
                  </button>

                  <button
                    onClick={() => setRejectVisitorModal(v)}
                    className="flex items-center justify-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>

                  <button
                    onClick={() => setSelectedVisitorForDetail(v)}
                    className="flex items-center justify-center p-2 text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-colors text-xs font-bold gap-1 border border-slate-200"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">Ficha</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History / All Visits for Host */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Historial General de Citas de {currentHost?.fullName} ({historyForHost.length})</span>
        </h3>

        {historyForHost.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
            No hay visitas previas registradas para este anfitrión.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Visitante</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Folio</th>
                  <th className="p-3">Fecha Cita</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyForHost.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitorForDetail(v)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-bold text-slate-900">{v.fullName}</td>
                    <td className="p-3 text-slate-700">{v.company}</td>
                    <td className="p-3 font-mono text-blue-900 font-bold">{v.qrFolio}</td>
                    <td className="p-3 text-slate-600">{formatSpanishDate(v.scheduledDateTime)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        v.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        v.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        v.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        v.status === 'CANCELLED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {v.status === 'APPROVED' ? 'Aprobada' :
                         v.status === 'CHECKED_IN' ? 'En Planta' :
                         v.status === 'REJECTED' ? 'Rechazada' :
                         v.status === 'CANCELLED' ? 'Cancelada' :
                         v.status === 'CHECKED_OUT' ? 'Salida' : v.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedVisitorForDetail(v)}
                        className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold text-xs border border-indigo-200 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ficha
                      </button>

                      {(v.status === 'APPROVED' || v.status === 'PENDING') && (
                        <button
                          onClick={() => setCancelVisitorModal(v)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold text-xs border border-rose-200 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Cancelar Cita"
                        >
                          <XCircle className="w-3 h-3" /> Cancelar
                        </button>
                      )}

                      <a
                        href={generateHostDecisionMailto(
                          v,
                          v.status === 'REJECTED' ? 'REJECTED' : v.status === 'CANCELLED' ? 'CANCELLED' : 'APPROVED',
                          v.rejectionReason || v.cancellationReason
                        )}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                      >
                        <Mail className="w-3.5 h-3.5" /> Notificar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Rechazar Cita de Visitante</span>
            </h3>

            <p className="text-xs text-slate-600">
              Favor de indicar la razón del rechazo para la visita de <strong>{rejectVisitorModal.fullName}</strong> ({rejectVisitorModal.company}):
            </p>

            <div>
              <textarea
                rows={3}
                placeholder="Ej. Conflicto de horario / Reunión fuera de planta / Falta documentación"
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
                onClick={handleConfirmReject}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancelar Cita Agendada</span>
            </h3>

            <p className="text-xs text-slate-600">
              Favor de indicar el motivo de la cancelación para la cita de <strong>{cancelVisitorModal.fullName}</strong> ({cancelVisitorModal.company}):
            </p>

            <div>
              <textarea
                rows={3}
                placeholder="Ej. Cita reprogramada / Incidencia laboral / Solicitud del visitante"
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelVisitorModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Detail Modal */}
      {selectedVisitorForDetail && (
        <GuardVisitorDetailModal
          visitor={selectedVisitorForDetail}
          hosts={hosts}
          onClose={() => setSelectedVisitorForDetail(null)}
          onCheckIn={() => setSelectedVisitorForDetail(null)}
          onCheckOut={() => setSelectedVisitorForDetail(null)}
          onViewPass={() => setSelectedVisitorForDetail(null)}
          onEdit={() => setSelectedVisitorForDetail(null)}
        />
      )}
    </div>
  );
};
