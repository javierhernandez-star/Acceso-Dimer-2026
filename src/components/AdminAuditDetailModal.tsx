import React from "react";
import { AuditLog, Visitor, Host } from "../types";
import { formatSpanishDate, formatSpanishTime } from "../lib/utils";
import {
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  Shield,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Car,
  Users,
  HardHat,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Printer
} from "lucide-react";

interface AdminAuditDetailModalProps {
  log: AuditLog;
  allVisitors: Visitor[];
  allHosts: Host[];
  onClose: () => void;
}

export const AdminAuditDetailModal: React.FC<AdminAuditDetailModalProps> = ({
  log,
  allVisitors,
  allHosts,
  onClose
}) => {
  // Retrieve matched visitor if available
  const matchedVisitor = log.visitorId
    ? allVisitors.find((v) => v.id === log.visitorId)
    : (log.visitorName ? allVisitors.find((v) => v.fullName.toLowerCase() === log.visitorName?.toLowerCase()) : undefined);

  // Retrieve matched host
  const matchedHost = log.hostId
    ? allHosts.find((h) => h.id === log.hostId)
    : (log.hostName ? allHosts.find((h) => h.fullName.toLowerCase() === log.hostName?.toLowerCase()) : undefined);

  // Merged fields
  const visitorName = log.visitorName || matchedVisitor?.fullName || "Visitante";
  const company = log.company || matchedVisitor?.company || "Particular";
  const accessType = log.accessType || matchedVisitor?.accessType || "Visita General";
  const qrFolio = log.qrFolio || matchedVisitor?.qrFolio || "N/A";
  const badgeNumber = log.badgeNumber || matchedVisitor?.badgeNumber;
  const hostName = log.hostName || matchedVisitor?.hostName || matchedHost?.fullName || "Anfitrión";
  const hostDept = log.hostDepartment || matchedVisitor?.department || matchedHost?.department || "Planta";
  const hostEmail = log.hostEmail || matchedVisitor?.hostEmail || matchedHost?.email || "";
  const visitorPhone = log.visitorPhone || matchedVisitor?.phone || "No especificado";
  const visitorEmail = log.visitorEmail || matchedVisitor?.email || "No especificado";
  const idDoc = (log.idType || matchedVisitor?.idType || "ID") + (log.idNumber || matchedVisitor?.idNumber ? `: ${log.idNumber || matchedVisitor?.idNumber}` : "");
  const vehiclePlates = log.vehiclePlates || matchedVisitor?.vehiclePlates;
  const scheduledTime = log.scheduledDateTime || matchedVisitor?.scheduledDateTime;
  const checkInTime = log.checkInTime || matchedVisitor?.checkInTime;
  const checkOutTime = log.checkOutTime || matchedVisitor?.checkOutTime;
  const companionsSummary = log.companionsSummary || (matchedVisitor?.companions && matchedVisitor.companions.length > 0 ? matchedVisitor.companions.map(c => c.fullName).join(", ") : undefined);

  // Calculate elapsed or total duration
  let durationFormatted = "";
  if (log.durationMinutes) {
    const hrs = Math.floor(log.durationMinutes / 60);
    const mins = log.durationMinutes % 60;
    durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutos`;
  } else if (checkInTime && checkOutTime) {
    const diffMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
    if (diffMs > 0) {
      const diffMins = Math.round(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutos`;
    }
  } else if (checkInTime && !checkOutTime) {
    const diffMs = Date.now() - new Date(checkInTime).getTime();
    if (diffMs > 0) {
      const diffMins = Math.round(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationFormatted = `Activo en Planta (hace ${hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`})`;
    } else {
      durationFormatted = "Activo en Planta";
    }
  }

  // Origin badge
  const origin = log.origin || (
    log.action === "EXPRESS_REGISTER" ? "CASETA" :
    log.action === "PRE_REGISTER" ? "WEB_PREREGISTER" :
    log.action === "CHECK_IN" || log.action === "CHECK_OUT" ? "CASETA" :
    log.action === "APPROVE" || log.action === "REJECT" ? "HOST_PORTAL" :
    "SISTEMA"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Ficha de Auditoría de Acceso</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  origin === 'CASETA' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                  origin === 'WEB_PREREGISTER' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                  origin === 'HOST_PORTAL' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {origin === 'CASETA' ? '🏢 Caseta (Registro Exprés)' :
                   origin === 'WEB_PREREGISTER' ? '🌐 Pre-Registro Web' :
                   origin === 'HOST_PORTAL' ? '👤 Portal Anfitrión' :
                   '👑 Administración'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Folio Registro: <strong className="text-amber-400">{qrFolio}</strong> • Evento: {formatSpanishDate(log.timestamp)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-xs">
          {/* Action and Performer Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acción Registrada</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  log.action === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  log.action === 'CHECK_OUT' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                  log.action === 'APPROVE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  log.action === 'REJECT' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                  log.action === 'EXPRESS_REGISTER' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                  'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {log.action === 'PRE_REGISTER' ? '🌐 Pre-Registro de Cita' :
                   log.action === 'EXPRESS_REGISTER' ? '⚡ Registro Exprés en Caseta' :
                   log.action === 'CHECK_IN' ? '🟢 Ingreso / Entrada a Planta' :
                   log.action === 'CHECK_OUT' ? '⚪ Salida de Planta' :
                   log.action === 'APPROVE' ? '✅ Cita Aprobada por Anfitrión' :
                   log.action === 'REJECT' ? '❌ Cita Rechazada' :
                   log.action === 'CANCEL' ? '⚠️ Cita Cancelada' :
                   log.action === 'EDIT_VISITOR' ? '✏️ Datos Modificados' :
                   log.action === 'DELETE_VISITOR' ? '🗑️ Registro Eliminado' :
                   log.action}
                </span>
                {badgeNumber && (
                  <span className="bg-amber-100 text-amber-950 font-mono font-bold px-2.5 py-1 rounded-lg border border-amber-300">
                    Gafete: {badgeNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operador / Ejecutado Por</p>
              <p className="font-bold text-slate-900 mt-1">{log.performedBy || "Sistema"}</p>
            </div>
          </div>

          {/* Dual Profile Grid: Visitor & Host */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visitor Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-amber-600" />
                <span>Datos del Visitante</span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nombre Completo</p>
                  <p className="font-bold text-slate-900 text-sm">{visitorName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Empresa / Procedencia</p>
                    <p className="font-semibold text-slate-800">{company}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Tipo de Acceso</p>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200 text-[10px]">
                      {accessType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Identificación</p>
                    <p className="font-mono text-slate-700 font-medium">{idDoc}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Teléfono</p>
                    <p className="font-mono text-slate-700">{visitorPhone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Correo Electrónico</p>
                  <p className="font-mono text-slate-700">{visitorEmail}</p>
                </div>

                {vehiclePlates && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Vehículo / Placas</p>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <Car className="w-3 h-3 text-slate-500" /> {vehiclePlates}
                    </span>
                  </div>
                )}

                {companionsSummary && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Acompañantes ({log.companionsCount || 1})</p>
                    <p className="text-slate-700 font-medium">{companionsSummary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Host Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Datos del Anfitrión</span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nombre del Empleado</p>
                  <p className="font-bold text-slate-900 text-sm">{hostName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Departamento</p>
                    <p className="font-semibold text-slate-800">{hostDept}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Zona de Planta</p>
                    <p className="font-medium text-slate-700">{matchedVisitor?.zone || "Planta General"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Correo Corporativo</p>
                  <p className="font-mono text-indigo-900">{hostEmail || "No registrado"}</p>
                </div>

                {matchedHost?.position && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Puesto / Cargo</p>
                    <p className="text-slate-700">{matchedHost.position}</p>
                  </div>
                )}

                {matchedHost?.phone && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Teléfono Interno</p>
                    <p className="font-mono text-slate-700">{matchedHost.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time & Flow Stamps */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Trazabilidad de Tiempos y Flujo de Seguridad
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Cita Programada</p>
                <p className="font-bold text-white text-xs mt-0.5">{formatSpanishDate(scheduledTime)}</p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] text-emerald-400 uppercase font-semibold">Entrada (Check-In)</p>
                <p className="font-bold text-emerald-300 text-xs mt-0.5">{formatSpanishDate(checkInTime)}</p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] text-blue-400 uppercase font-semibold">Salida (Check-Out)</p>
                <p className="font-bold text-blue-300 text-xs mt-0.5">{formatSpanishDate(checkOutTime)}</p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <p className="text-[10px] text-amber-400 uppercase font-semibold">Tiempo en Planta</p>
                <p className="font-bold text-amber-300 text-xs mt-0.5">{durationFormatted || "Pendiente"}</p>
              </div>
            </div>
          </div>

          {/* Detail Description & Technical Notes */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1.5">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Detalles Registrados en Bitácora</p>
            <p className="text-slate-800 font-medium text-xs leading-relaxed">{log.details}</p>
            {log.rejectionOrCancelReason && (
              <p className="text-rose-700 font-bold text-xs mt-1">
                Motivo especificado: {log.rejectionOrCancelReason}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Log ID: {log.id}
          </span>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-md"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
