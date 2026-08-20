import React, { useState } from "react";
import { AuditLog, Visitor, Host } from "../types";
import { formatSpanishDate } from "../lib/utils";
import { exportAuditLogsToCSV } from "../lib/utils";
import { AdminAuditDetailModal } from "./AdminAuditDetailModal";
import {
  FileSpreadsheet,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  Filter,
  User,
  Building2,
  Shield,
  FileText,
  Sparkles,
  LayoutGrid,
  List
} from "lucide-react";

interface AdminAuditTabProps {
  auditLogs: AuditLog[];
  visitors: Visitor[];
  hosts: Host[];
  onExportJSON: () => void;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({
  auditLogs,
  visitors,
  hosts,
  onExportJSON
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Visitors Map for fast fallback lookup
  const visitorsMap = new Map<string, Visitor>();
  visitors.forEach((v) => {
    if (v.id) visitorsMap.set(v.id, v);
    if (v.fullName) visitorsMap.set(v.fullName.toLowerCase(), v);
  });

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (log.visitorName && log.visitorName.toLowerCase().includes(term)) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.company && log.company.toLowerCase().includes(term)) ||
      (log.hostName && log.hostName.toLowerCase().includes(term)) ||
      (log.qrFolio && log.qrFolio.toLowerCase().includes(term)) ||
      (log.badgeNumber && log.badgeNumber.toLowerCase().includes(term));

    const matchesAction =
      actionFilter === "ALL" ||
      log.action === actionFilter;

    const logOrigin = log.origin || (
      log.action === "EXPRESS_REGISTER" ? "CASETA" :
      log.action === "PRE_REGISTER" ? "WEB_PREREGISTER" :
      log.action === "CHECK_IN" || log.action === "CHECK_OUT" ? "CASETA" :
      log.action === "APPROVE" || log.action === "REJECT" ? "HOST_PORTAL" :
      "ADMIN_PORTAL"
    );

    const matchesOrigin =
      originFilter === "ALL" ||
      logOrigin === originFilter;

    return matchesSearch && matchesAction && matchesOrigin;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header with Title and Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Bitácora de Auditoría y Trazabilidad Total</span>
          </h3>
          <p className="text-xs text-slate-500">
            Registro detallado de canal de origen (Caseta / Pre-Registro), anfitrión, visitante, tiempos de entrada y salida.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          <button
            onClick={() => exportAuditLogsToCSV(auditLogs, visitors)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onExportJSON}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl border border-slate-300 transition-colors flex items-center gap-1"
            title="Descargar Respaldo JSON"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registros</p>
          <p className="text-2xl font-black text-slate-900">{auditLogs.length}</p>
          <p className="text-[10px] text-slate-400">Eventos de seguridad y acceso</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Caseta (Exprés)</p>
          <p className="text-2xl font-black text-purple-900">
            {auditLogs.filter((l) => l.origin === 'CASETA' || l.action === 'EXPRESS_REGISTER').length}
          </p>
          <p className="text-[10px] text-purple-600">Eventos desde Caseta</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Pre-Registros Web</p>
          <p className="text-2xl font-black text-emerald-900">
            {auditLogs.filter((l) => l.origin === 'WEB_PREREGISTER' || l.action === 'PRE_REGISTER').length}
          </p>
          <p className="text-[10px] text-emerald-600">Citas creadas por visitantes</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl space-y-1">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Check-Ins / Entradas</p>
          <p className="text-2xl font-black text-blue-900">
            {auditLogs.filter((l) => l.action === 'CHECK_IN').length}
          </p>
          <p className="text-[10px] text-blue-600">Ingresos a planta registrados</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por visitante, anfitrión, empresa, operador, folio o detalle..."
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
            <option value="ALL">Canal / Origen: Todos</option>
            <option value="CASETA">🏢 Caseta (Registro Exprés)</option>
            <option value="WEB_PREREGISTER">🌐 Pre-Registro Web</option>
            <option value="HOST_PORTAL">👤 Portal Anfitrión</option>
            <option value="ADMIN_PORTAL">👑 Administración</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">Evento: Todos</option>
            <option value="PRE_REGISTER">🌐 Pre-Registro</option>
            <option value="EXPRESS_REGISTER">⚡ Registro Exprés</option>
            <option value="CHECK_IN">🟢 Entrada (Check-In)</option>
            <option value="CHECK_OUT">⚪ Salida (Check-Out)</option>
            <option value="APPROVE">🔵 Aprobación Cita</option>
            <option value="REJECT">🔴 Rechazo Cita</option>
            <option value="CANCEL">⚠️ Cancelación</option>
            <option value="EDIT_VISITOR">✏️ Modificación</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm text-slate-700">No se encontraron registros de bitácora</p>
              <p className="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros de búsqueda o canal.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const matchedVisitor = log.visitorId ? visitorsMap.get(log.visitorId) : (log.visitorName ? visitorsMap.get(log.visitorName.toLowerCase()) : undefined);

              const origin = log.origin || (
                log.action === "EXPRESS_REGISTER" ? "CASETA" :
                log.action === "PRE_REGISTER" ? "WEB_PREREGISTER" :
                log.action === "CHECK_IN" || log.action === "CHECK_OUT" ? "CASETA" :
                log.action === "APPROVE" || log.action === "REJECT" ? "HOST_PORTAL" :
                "ADMIN_PORTAL"
              );

              const visitorName = log.visitorName || matchedVisitor?.fullName || "--";
              const company = log.company || matchedVisitor?.company || "Particular";
              const hostName = log.hostName || matchedVisitor?.hostName || "--";
              const qrFolio = log.qrFolio || matchedVisitor?.qrFolio;
              const badge = log.badgeNumber || matchedVisitor?.badgeNumber;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                        origin === 'CASETA' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        origin === 'WEB_PREREGISTER' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        origin === 'HOST_PORTAL' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {origin === 'CASETA' ? '🏢 Caseta' :
                         origin === 'WEB_PREREGISTER' ? '🌐 Web' :
                         origin === 'HOST_PORTAL' ? '👤 Anfitrión' : '👑 Admin'}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {formatSpanishDate(log.timestamp).split(" ")[0]} {formatSpanishDate(log.timestamp).split(" ")[1]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          log.action === 'CHECK_OUT' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                          log.action === 'APPROVE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          log.action === 'REJECT' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          log.action === 'EXPRESS_REGISTER' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {log.action === 'PRE_REGISTER' ? '🌐 Pre-Registro' :
                           log.action === 'EXPRESS_REGISTER' ? '⚡ Registro Exprés' :
                           log.action === 'CHECK_IN' ? '🟢 Entrada' :
                           log.action === 'CHECK_OUT' ? '⚪ Salida' :
                           log.action === 'APPROVE' ? '✅ Aprobada' :
                           log.action === 'REJECT' ? '❌ Rechazada' :
                           log.action === 'CANCEL' ? '⚠️ Cancelada' :
                           log.action === 'EDIT_VISITOR' ? '✏️ Editado' : log.action}
                        </span>

                        {badge && (
                          <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                            Gafete: {badge}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 group-hover:text-indigo-600 transition-colors">
                        {visitorName}
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold">{company}</p>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-slate-600 text-xs space-y-1">
                      <p className="truncate">👤 <strong>Anfitrión:</strong> {hostName}</p>
                      {qrFolio && <p className="font-mono text-[11px]">🎟️ <strong>Folio:</strong> {qrFolio}</p>}
                      <p className="text-[11px] text-slate-500 truncate">⚙️ <strong>Por:</strong> {log.performedBy || 'Sistema'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px] italic">
                      {log.details}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Detailed Audit Table */
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Canal / Origen</th>
                <th className="p-3">Evento / Acción</th>
                <th className="p-3">Visitante & Empresa</th>
                <th className="p-3">Anfitrión & Destino</th>
                <th className="p-3">Realizado Por</th>
                <th className="p-3">Entrada / Salida</th>
                <th className="p-3 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const matchedVisitor = log.visitorId ? visitorsMap.get(log.visitorId) : (log.visitorName ? visitorsMap.get(log.visitorName.toLowerCase()) : undefined);

                const origin = log.origin || (
                  log.action === "EXPRESS_REGISTER" ? "CASETA" :
                  log.action === "PRE_REGISTER" ? "WEB_PREREGISTER" :
                  log.action === "CHECK_IN" || log.action === "CHECK_OUT" ? "CASETA" :
                  log.action === "APPROVE" || log.action === "REJECT" ? "HOST_PORTAL" :
                  "ADMIN_PORTAL"
                );

                const visitorName = log.visitorName || matchedVisitor?.fullName || "--";
                const company = log.company || matchedVisitor?.company || "Particular";
                const hostName = log.hostName || matchedVisitor?.hostName || "--";
                const hostDept = log.hostDepartment || matchedVisitor?.department || "";
                const qrFolio = log.qrFolio || matchedVisitor?.qrFolio;
                const badge = log.badgeNumber || matchedVisitor?.badgeNumber;

                const checkInTime = log.checkInTime || matchedVisitor?.checkInTime;
                const checkOutTime = log.checkOutTime || matchedVisitor?.checkOutTime;

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {/* Timestamp */}
                    <td className="p-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      <div className="font-bold text-slate-900">{formatSpanishDate(log.timestamp).split(" ")[0]}</div>
                      <div className="text-slate-500">{formatSpanishDate(log.timestamp).split(" ").slice(1).join(" ")}</div>
                    </td>

                    {/* Origin */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                        origin === 'CASETA' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        origin === 'WEB_PREREGISTER' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        origin === 'HOST_PORTAL' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {origin === 'CASETA' ? '🏢 Caseta (Exprés)' :
                         origin === 'WEB_PREREGISTER' ? '🌐 Pre-Registro' :
                         origin === 'HOST_PORTAL' ? '👤 Anfitrión' :
                         '👑 Administración'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        log.action === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        log.action === 'CHECK_OUT' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                        log.action === 'APPROVE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        log.action === 'REJECT' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        log.action === 'EXPRESS_REGISTER' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {log.action === 'PRE_REGISTER' ? '🌐 Pre-Registro' :
                         log.action === 'EXPRESS_REGISTER' ? '⚡ Registro Exprés' :
                         log.action === 'CHECK_IN' ? '🟢 Entrada / En Planta' :
                         log.action === 'CHECK_OUT' ? '⚪ Salida de Planta' :
                         log.action === 'APPROVE' ? '✅ Cita Aprobada' :
                         log.action === 'REJECT' ? '❌ Cita Rechazada' :
                         log.action === 'CANCEL' ? '⚠️ Cancelada' :
                         log.action === 'EDIT_VISITOR' ? '✏️ Editado' :
                         log.action === 'DELETE_VISITOR' ? '🗑️ Eliminado' :
                         log.action}
                      </span>
                      {badge && (
                        <p className="font-mono text-[10px] text-amber-900 font-bold mt-0.5">Gafete: {badge}</p>
                      )}
                    </td>

                    {/* Visitor */}
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{visitorName}</p>
                      <p className="text-slate-500 text-[11px]">{company}</p>
                      {qrFolio && (
                        <p className="text-slate-400 font-mono text-[10px]">Folio: {qrFolio}</p>
                      )}
                    </td>

                    {/* Host */}
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{hostName}</p>
                      {hostDept && <p className="text-slate-500 text-[11px]">{hostDept}</p>}
                    </td>

                    {/* Performed By */}
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{log.performedBy || "Sistema"}</p>
                    </td>

                    {/* Times */}
                    <td className="p-3 text-[11px] font-mono whitespace-nowrap">
                      {checkInTime ? (
                        <p className="text-emerald-700 font-semibold">
                          In: {formatSpanishDate(checkInTime).split(" ").slice(1).join(" ")}
                        </p>
                      ) : (
                        <p className="text-slate-400">In: --</p>
                      )}
                      {checkOutTime ? (
                        <p className="text-blue-700 font-semibold">
                          Out: {formatSpanishDate(checkOutTime).split(" ").slice(1).join(" ")}
                        </p>
                      ) : (
                        <p className="text-slate-400">Out: --</p>
                      )}
                    </td>

                    {/* Action detail */}
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                        title="Ver Ficha Detallada"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for full detail */}
      {selectedLog && (
        <AdminAuditDetailModal
          log={selectedLog}
          allVisitors={visitors}
          allHosts={hosts}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};
