import React, { useState } from "react";
import { Host, Visitor, AuditLog } from "../types";
import { AdminEmployeeDetailModal } from "./AdminEmployeeDetailModal";
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  Building2,
  Sparkles,
  Eye,
  ShieldCheck,
  UserCheck
} from "lucide-react";

interface AdminEmployeesTabProps {
  hosts: Host[];
  allVisitors: Visitor[];
  allLogs: AuditLog[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (host: Host) => void;
  onToggleStatus: (host: Host) => void;
  onDeleteHost: (host: Host) => void;
}

export const AdminEmployeesTab: React.FC<AdminEmployeesTabProps> = ({
  hosts,
  allVisitors,
  allLogs,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onDeleteHost
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedHostForDetail, setSelectedHostForDetail] = useState<Host | null>(null);

  const departments = Array.from(new Set(hosts.map((h) => h.department).filter(Boolean)));

  const filteredHosts = hosts.filter((h) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      h.fullName.toLowerCase().includes(term) ||
      h.email.toLowerCase().includes(term) ||
      (h.phone && h.phone.toLowerCase().includes(term)) ||
      h.department.toLowerCase().includes(term) ||
      h.position.toLowerCase().includes(term);

    const matchesDept = deptFilter === "ALL" || h.department === deptFilter;
    const matchesRole = roleFilter === "ALL" || (h.role || "HOST") === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Directorio de Empleados ({hosts.length} Registrados)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Administre las cuentas de los colaboradores, roles de acceso, contraseñas NIP y departamentos.
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
            onClick={onOpenCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Quick Credential Guide Banner */}
      <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Información de Acceso de Empleados:</p>
          <p className="text-[11px] text-indigo-800 mt-0.5">
            Haga clic sobre cualquier tarjeta de empleado para inspeccionar su NIP, historial de visitas y opciones de edición.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono, puesto o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">Departamento: Todos</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">Rol: Todos</option>
            <option value="ADMIN">👑 Administrador</option>
            <option value="GUARD">🛡️ Guardia</option>
            <option value="HOST">👤 Anfitrión</option>
          </select>
        </div>
      </div>

      {/* Content: Cards or Table */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHosts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm text-slate-700">No se encontraron empleados</p>
              <p className="text-xs text-slate-400 mt-1">Pruebe modificando los términos de búsqueda o filtros.</p>
            </div>
          ) : (
            filteredHosts.map((h) => {
              const hostVisitCount = allVisitors.filter(
                (v) => v.hostId === h.id || (v.hostName && v.hostName.toLowerCase() === h.fullName.toLowerCase())
              ).length;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHostForDetail(h)}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {h.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {h.fullName}
                          </h4>
                          <p className="text-slate-500 text-xs font-semibold">{h.position}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${
                          h.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : h.role === "GUARD"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {h.role === "ADMIN" ? "👑 Admin" : h.role === "GUARD" ? "🛡️ Guardia" : "👤 Anfitrión"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 text-xs space-y-1">
                      <p className="font-mono text-indigo-900 font-semibold truncate flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{h.email}</span>
                      </p>
                      <p className="truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{h.department}</span>
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="font-mono text-[11px] text-slate-500">
                          NIP: <strong className="text-slate-900">{h.pin || h.passwordPin || "1234"}</strong>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Citas: <strong>{hostVisitCount}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        h.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {h.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHostForDetail(h);
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
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Empleado</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Departamento / Puesto</th>
                <th className="p-3">Usuario (Correo) & Teléfono</th>
                <th className="p-3">Contraseña / NIP</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHosts.map((h, idx) => (
                <tr
                  key={h.id}
                  onClick={() => setSelectedHostForDetail(h)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{h.fullName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                        h.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : h.role === "GUARD"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {h.role === "ADMIN" ? "👑 Admin" : h.role === "GUARD" ? "🛡️ Guardia" : "👤 Anfitrión"}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-800">{h.department}</p>
                    <p className="text-[11px] text-slate-500">{h.position}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-indigo-900 font-mono font-semibold">{h.email}</p>
                    <p className="text-slate-500 text-[11px]">{h.phone}</p>
                  </td>
                  <td className="p-3">
                    <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-bold border border-slate-200">
                      {h.pin || h.passwordPin || "1234"}
                    </span>
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus(h)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                        h.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {h.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenEditModal(h)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Empleado"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteHost(h)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Empleado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedHostForDetail && (
        <AdminEmployeeDetailModal
          host={selectedHostForDetail}
          allVisitors={allVisitors}
          allLogs={allLogs}
          onClose={() => setSelectedHostForDetail(null)}
          onEdit={(h) => onOpenEditModal(h)}
          onToggleStatus={(h) => onToggleStatus(h)}
          onDelete={(h) => onDeleteHost(h)}
        />
      )}
    </div>
  );
};
