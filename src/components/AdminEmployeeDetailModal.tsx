import React, { useEffect } from "react";
import { Host, Visitor, AuditLog } from "../types";
import { formatSpanishDate } from "../lib/utils";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  KeyRound,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Activity,
  History
} from "lucide-react";

interface AdminEmployeeDetailModalProps {
  host: Host;
  allVisitors: Visitor[];
  allLogs: AuditLog[];
  onClose: () => void;
  onEdit: (host: Host) => void;
  onToggleStatus: (host: Host) => void;
  onDelete: (host: Host) => void;
}

export const AdminEmployeeDetailModal: React.FC<AdminEmployeeDetailModalProps> = ({
  host,
  allVisitors,
  allLogs,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Associated visitors where this employee is the host
  const hostVisitors = allVisitors.filter(
    (v) =>
      v.hostId === host.id ||
      (v.hostName && v.hostName.toLowerCase() === host.fullName.toLowerCase()) ||
      (v.hostEmail && v.hostEmail.toLowerCase() === host.email.toLowerCase())
  );

  const pendingVisits = hostVisitors.filter((v) => v.status === "PENDING").length;
  const approvedVisits = hostVisitors.filter((v) => v.status === "APPROVED" || v.status === "CHECKED_IN").length;
  const totalVisits = hostVisitors.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black text-2xl shadow-inner">
              {host.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{host.fullName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                    host.role === "ADMIN"
                      ? "bg-purple-500/20 text-purple-200 border-purple-400/30"
                      : host.role === "GUARD"
                      ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                      : "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  }`}
                >
                  {host.role === "ADMIN" ? "👑 Administrador" : host.role === "GUARD" ? "🛡️ Guardia" : "👤 Anfitrión"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                    host.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }`}
                >
                  {host.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                {host.position} • {host.department}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Citas</p>
              <p className="text-xl font-black text-slate-800">{totalVisits}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pendientes</p>
              <p className="text-xl font-black text-amber-900">{pendingVisits}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Aprobadas</p>
              <p className="text-xl font-black text-emerald-900">{approvedVisits}</p>
            </div>
          </div>

          {/* Account & Contact Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Credenciales y Contacto</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" /> Correo Institucional (Usuario)
                </span>
                <p className="font-semibold text-slate-900 font-mono break-all">{host.email}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Contraseña / NIP de Ingreso
                </span>
                <p className="font-black text-slate-900 font-mono text-sm">
                  {host.pin || host.passwordPin || "1234"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Teléfono / Extensión
                </span>
                <p className="font-semibold text-slate-900">{host.phone || "No registrado"}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-500" /> Departamento
                </span>
                <p className="font-semibold text-slate-900">{host.department}</p>
              </div>
            </div>
          </div>

          {/* Recent Visits for this Host */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Citas Registradas con este Empleado ({hostVisitors.length})</span>
            </h4>

            {hostVisitors.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                No hay citas asociadas registradas para este empleado.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hostVisitors.slice(0, 10).map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{v.fullName}</p>
                      <p className="text-[11px] text-slate-500">{v.company || "Particular"} • {v.scheduledDate || "Fecha N/A"}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        v.status === "APPROVED"
                          ? "bg-blue-100 text-blue-800"
                          : v.status === "CHECKED_IN"
                          ? "bg-emerald-100 text-emerald-800"
                          : v.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onToggleStatus(host)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              host.status === "ACTIVE"
                ? "bg-amber-100 hover:bg-amber-200 text-amber-900"
                : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
            }`}
          >
            {host.status === "ACTIVE" ? "Desactivar Empleado" : "Activar Empleado"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(host)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(host);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Editar Datos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
