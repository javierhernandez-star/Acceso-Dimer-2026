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
  List,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Tag,
  ArrowUpDown
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
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Visitors Map for fast fallback lookup
  const visitorsMap = new Map<string, Visitor>();
  visitors.forEach((v) => {
    if (v.id) visitorsMap.set(v.id, v);
    if (v.fullName) visitorsMap.set(v.fullName.toLowerCase(), v);
  });

  const todayIso = new Date().toISOString().split("T")[0];

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

    const logDate = log.timestamp ? log.timestamp.split("T")[0] : "";
    const matchesDate =
      dateFilter === "ALL" ||
      (dateFilter === "TODAY" && logDate === todayIso);

    return matchesSearch && matchesAction && matchesOrigin && matchesDate;
  });

  const totalCheckIns = auditLogs.filter((l) => l.action === "CHECK_IN").length;
  const totalCheckOuts = auditLogs.filter((l) => l.action === "CHECK_OUT").length;
  const totalExpress = auditLogs.filter((l) => l.origin === 'CASETA' || l.action === 'EXPRESS_REGISTER').length;
  const totalPreregister = auditLogs.filter((l) => l.origin === 'WEB_PREREGISTER' || l.action === 'PRE_REGISTER').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Enterprise Top Banner with Integrity Assurance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Bitácora Oficial de Auditoría & Trazabilidad de Accesos</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Inmutable / Auditoría ISO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico estricto de eventos de caseta, portal anfitrión y administración. Cumple requerimientos de trazabilidad y auditorías corporativas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Vista en Tabla de Auditoría"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
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
          </div>

          <button
            onClick={() => exportAuditLogsToCSV(auditLogs, visitors)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Descargar CSV para Auditoría</span>
          </button>

          <button
            onClick={onExportJSON}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl border border-slate-300 transition-colors flex items-center gap-1"
            title="Descargar Respaldo JSON de Seguridad"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Eventos</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black">{auditLogs.length}</p>
            <p className="text-[10px] text-slate-400">Trazas de seguridad registradas</p>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-900">Entradas (Check-In)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-950">{totalCheckIns}</p>
            <p className="text-[10px] text-emerald-700">Ingresos a planta validados</p>
          </div>
        </div>

        <div className="bg-slate-100/80 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-800">Salidas (Check-Out)</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900">{totalCheckOuts}</p>
            <p className="text-[10px] text-slate-600">Retiros de planta auditados</p>
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-900">Caseta Exprés</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-purple-950">{totalExpress}</p>
            <p className="text-[10px] text-purple-700">Acciones de guardia en caseta</p>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">Pre-Registros Web</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-blue-950">{totalPreregister}</p>
            <p className="text-[10px] text-blue-700">Citas creadas por visitantes</p>
          </div>
        </div>
      </div>

      {/* Search & Audit Filters Bar */}
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar en bitácora por visitante, anfitrión, empresa, operador, gafete, folio o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Canal / Origen: Todos</option>
              <option value="CASETA">🏢 Caseta (Guardia)</option>
              <option value="WEB_PREREGISTER">🌐 Pre-Registro Web</option>
              <option value="HOST_PORTAL">👤 Portal Anfitrión</option>
              <option value="ADMIN_PORTAL">👑 Panel Administrador</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tipo de Evento: Todos</option>
              <option value="CHECK_IN">🟢 Entrada (Check-In)</option>
              <option value="CHECK_OUT">⚪ Salida (Check-Out)</option>
              <option value="PRE_REGISTER">🌐 Pre-Registro Web</option>
              <option value="EXPRESS_REGISTER">⚡ Registro Exprés Caseta</option>
              <option value="APPROVE">🔵 Aprobación por Anfitrión</option>
              <option value="REJECT">🔴 Rechazo por Anfitrión</option>
              <option value="CANCEL">⚠️ Cancelación</option>
              <option value="EDIT_VISITOR">✏️ Modificación de Pase</option>
              <option value="CONFIG_UPDATE">⚙️ Actualización de Ajustes</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Periodo: Histórico Completo</option>
              <option value="TODAY">📅 Eventos de Hoy</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Eventos Frecuentes:
          </span>
          <button
            onClick={() => { setActionFilter("ALL"); setOriginFilter("ALL"); setDateFilter("ALL"); setSearchTerm(""); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              actionFilter === "ALL" && originFilter === "ALL" && dateFilter === "ALL" && !searchTerm
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todos ({auditLogs.length})
          </button>
          <button
            onClick={() => { setActionFilter("CHECK_IN"); setDateFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              actionFilter === "CHECK_IN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            Check-Ins ({totalCheckIns})
          </button>
          <button
            onClick={() => { setActionFilter("CHECK_OUT"); setDateFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              actionFilter === "CHECK_OUT"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Check-Outs ({totalCheckOuts})
          </button>
          <button
            onClick={() => { setOriginFilter("CASETA"); setActionFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              originFilter === "CASETA"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            Movimientos en Caseta
          </button>
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
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                        origin === 'CASETA' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        origin === 'WEB_PREREGISTER' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        origin === 'HOST_PORTAL' ? 'bg-blue-50 text-blue-800 border-blue-200' :
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.action === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          log.action === 'CHECK_OUT' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                          log.action === 'APPROVE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          log.action === 'REJECT' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          log.action === 'EXPRESS_REGISTER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          'bg-amber-50 text-amber-900 border-amber-200'
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

                      <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 group-hover:text-amber-700 transition-colors">
                        {visitorName}
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold">{company}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 text-xs space-y-1">
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
                      className="text-amber-800 hover:text-amber-950 text-xs font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors border border-amber-200/60"
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
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-200 rounded-2xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold sticky top-0 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5 pl-4">Fecha / Hora Evento</th>
                <th className="p-3.5">Canal de Origen</th>
                <th className="p-3.5">Evento / Acción</th>
                <th className="p-3.5">Visitante & Empresa</th>
                <th className="p-3.5">Anfitrión / Depto</th>
                <th className="p-3.5">Operador / Usuario</th>
                <th className="p-3.5">Tiempos de Planta</th>
                <th className="p-3.5 pr-4 text-right">Ficha de Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No se encontraron eventos en la bitácora</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pruebe ajustando los filtros de búsqueda.</p>
                  </td>
                </tr>
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
                  const hostDept = log.hostDepartment || matchedVisitor?.department || "";
                  const qrFolio = log.qrFolio || matchedVisitor?.qrFolio;
                  const badge = log.badgeNumber || matchedVisitor?.badgeNumber;

                  const checkInTime = log.checkInTime || matchedVisitor?.checkInTime;
                  const checkOutTime = log.checkOutTime || matchedVisitor?.checkOutTime;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="p-3.5 pl-4 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                        <div className="font-bold text-slate-900">{formatSpanishDate(log.timestamp).split(" ")[0]}</div>
                        <div className="text-slate-500 font-medium">{formatSpanishDate(log.timestamp).split(" ").slice(1).join(" ")}</div>
                      </td>

                      {/* Origin */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          origin === 'CASETA' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          origin === 'WEB_PREREGISTER' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          origin === 'HOST_PORTAL' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {origin === 'CASETA' ? '🏢 Caseta (Guardia)' :
                           origin === 'WEB_PREREGISTER' ? '🌐 Pre-Registro' :
                           origin === 'HOST_PORTAL' ? '👤 Anfitrión' :
                           '👑 Administración'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          log.action === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-black' :
                          log.action === 'CHECK_OUT' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                          log.action === 'APPROVE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          log.action === 'REJECT' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          log.action === 'EXPRESS_REGISTER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {log.action === 'PRE_REGISTER' ? '🌐 Pre-Registro' :
                           log.action === 'EXPRESS_REGISTER' ? '⚡ Registro Exprés' :
                           log.action === 'CHECK_IN' ? '🟢 Entrada a Planta' :
                           log.action === 'CHECK_OUT' ? '⚪ Salida de Planta' :
                           log.action === 'APPROVE' ? '✅ Cita Aprobada' :
                           log.action === 'REJECT' ? '❌ Cita Rechazada' :
                           log.action === 'CANCEL' ? '⚠️ Cancelada' :
                           log.action === 'EDIT_VISITOR' ? '✏️ Editado' :
                           log.action === 'DELETE_VISITOR' ? '🗑️ Eliminado' :
                           log.action === 'CONFIG_UPDATE' ? '⚙️ Configuración' : log.action}
                        </span>
                        {badge && (
                          <p className="font-mono text-[10px] text-amber-900 font-bold mt-0.5">Gafete: {badge}</p>
                        )}
                      </td>

                      {/* Visitor */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{visitorName}</p>
                        <p className="text-slate-500 text-[11px] font-medium">{company}</p>
                        {qrFolio && (
                          <p className="text-slate-400 font-mono text-[10px]">Folio: {qrFolio}</p>
                        )}
                      </td>

                      {/* Host */}
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{hostName}</p>
                        {hostDept && <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mt-0.5">{hostDept}</span>}
                      </td>

                      {/* Performed By */}
                      <td className="p-3.5">
                        <p className="font-medium text-slate-800">{log.performedBy || "Sistema"}</p>
                      </td>

                      {/* Times */}
                      <td className="p-3.5 text-[11px] font-mono whitespace-nowrap">
                        {checkInTime ? (
                          <p className="text-emerald-700 font-bold">
                            In: {formatSpanishDate(checkInTime).split(" ").slice(1).join(" ")}
                          </p>
                        ) : (
                          <p className="text-slate-400">In: --</p>
                        )}
                        {checkOutTime ? (
                          <p className="text-blue-700 font-bold">
                            Out: {formatSpanishDate(checkOutTime).split(" ").slice(1).join(" ")}
                          </p>
                        ) : (
                          <p className="text-slate-400">Out: --</p>
                        )}
                      </td>

                      {/* Action detail */}
                      <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-xl transition-all inline-flex items-center gap-1 font-bold text-[11px] shadow-sm"
                          title="Ver Ficha Detallada de Auditoría"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Auditar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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

