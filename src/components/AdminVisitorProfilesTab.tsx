import React, { useState } from "react";
import { VisitorProfile, AccessType, IdType, Visitor } from "../types";
import { formatSpanishDate } from "../lib/utils";
import { AdminVisitorProfileDetailModal } from "./AdminVisitorProfileDetailModal";
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Car,
  X,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
  Eye,
  History
} from "lucide-react";

interface AdminVisitorProfilesTabProps {
  profiles: VisitorProfile[];
  visitors?: Visitor[];
  onAddProfile: (profile: Omit<VisitorProfile, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdateProfile: (id: string, updates: Partial<VisitorProfile>) => Promise<void>;
  onDeleteProfile: (id: string, visitorName: string) => Promise<void>;
}

export const AdminVisitorProfilesTab: React.FC<AdminVisitorProfilesTabProps> = ({
  profiles,
  visitors = [],
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [editingProfile, setEditingProfile] = useState<VisitorProfile | null>(null);
  const [selectedProfileForDetail, setSelectedProfileForDetail] = useState<VisitorProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for modal
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIdType, setFormIdType] = useState<IdType>("INE");
  const [formIdNumber, setFormIdNumber] = useState("");
  const [formAccessType, setFormAccessType] = useState<AccessType>("Visita General");
  const [formVehiclePlates, setFormVehiclePlates] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const handleOpenEdit = (profile: VisitorProfile) => {
    setEditingProfile(profile);
    setFormName(profile.fullName || "");
    setFormCompany(profile.company || "");
    setFormEmail(profile.email || "");
    setFormPhone(profile.phone || "");
    setFormIdType(profile.idType || "INE");
    setFormIdNumber(profile.idNumber || "");
    setFormAccessType(profile.accessType || "Visita General");
    setFormVehiclePlates(profile.vehiclePlates || "");
    setFormNotes(profile.notes || "");
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormName("");
    setFormCompany("");
    setFormEmail("");
    setFormPhone("");
    setFormIdType("INE");
    setFormIdNumber("");
    setFormAccessType("Visita General");
    setFormVehiclePlates("");
    setFormNotes("");
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCompany.trim()) {
      alert("Por favor complete el nombre y empresa del visitante.");
      return;
    }

    try {
      if (editingProfile) {
        await onUpdateProfile(editingProfile.id, {
          fullName: formName.trim(),
          company: formCompany.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          idType: formIdType,
          idNumber: formIdNumber.trim(),
          accessType: formAccessType,
          vehiclePlates: formVehiclePlates.trim().toUpperCase(),
          notes: formNotes.trim()
        });
      } else {
        await onAddProfile({
          fullName: formName.trim(),
          company: formCompany.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          idType: formIdType,
          idNumber: formIdNumber.trim(),
          accessType: formAccessType,
          vehiclePlates: formVehiclePlates.trim().toUpperCase(),
          notes: formNotes.trim(),
          totalVisits: 0
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert("Error al guardar el perfil: " + err.message);
    }
  };

  const handleDelete = async (profile: VisitorProfile) => {
    if (window.confirm(`¿Está seguro de eliminar permanentemente a "${profile.fullName}" del Padrón de Visitantes?`)) {
      try {
        await onDeleteProfile(profile.id, profile.fullName);
      } catch (err: any) {
        alert("Error al eliminar el visitante: " + err.message);
      }
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.fullName.toLowerCase().includes(term) ||
      p.company.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.idNumber.toLowerCase().includes(term) ||
      (p.vehiclePlates && p.vehiclePlates.toLowerCase().includes(term));

    const matchesCategory =
      categoryFilter === "ALL" || p.accessType === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Banner explaining dedicated tab */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <span>Padrón General de Visitantes ({profiles.length} Personas Registradas)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Directorio maestro e individual de visitantes. Los registros en este padrón son permanentes y <strong>no se eliminan</strong> aunque se borren o cancelen citas individuales.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nuevo Visitante en Padrón</span>
        </button>
      </div>

      {/* Search, Category Filter & View Mode */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar visitante por nombre, empresa, INE / ID, correo o placas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Visita General">Visita General</option>
            <option value="Contratista">Contratista</option>
            <option value="Proveedor">Proveedor</option>
            <option value="Entrevista">Entrevista</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista en Tarjetas"
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
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RENDER PROFILES */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl space-y-2">
          <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Sin visitantes en el padrón</p>
          <p className="text-xs text-slate-400">No se encontraron registros con los filtros actuales.</p>
        </div>
      ) : viewMode === "cards" ? (
        /* INTERACTIVE COMPACT PREVIEW CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProfileForDetail(p)}
              className="bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-amber-400 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative min-w-0 break-words"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-extrabold uppercase border border-amber-200 tracking-wider">
                      {p.accessType || "Visita General"}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base mt-1 group-hover:text-amber-800 transition-colors truncate">
                      {p.fullName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.company}</span>
                    </p>
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    {p.totalVisits || 0} {p.totalVisits === 1 ? "visita" : "visitas"}
                  </span>
                </div>

                {/* Compact Summary Box */}
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">ID / Doc:</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate">
                      {p.idNumber ? `${p.idType || "ID"}: ${p.idNumber}` : "Sin ID"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Contacto:</span>
                    <span className="font-semibold text-slate-700 text-[11px] truncate" title={p.phone || p.email}>
                      {p.phone || p.email || "--"}
                    </span>
                  </div>

                  {p.lastVisitDate && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-slate-400">Última Visita:</span>
                      <span className="font-bold text-slate-700 truncate">
                        🕒 {formatSpanishDate(p.lastVisitDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                <span className="text-amber-700 font-bold flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform text-xs">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ver Expediente</span>
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                    title="Editar Visitante"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                    title="Eliminar del Padrón"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* PROFILES TABLE */
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Nombre del Visitante</th>
                <th className="p-3">Empresa / Procedencia</th>
                <th className="p-3">Categoría Habitual</th>
                <th className="p-3">Documento de ID</th>
                <th className="p-3">Contacto (Correo & Teléfono)</th>
                <th className="p-3">Vehículo / Placas</th>
                <th className="p-3 text-center">Visitas Totales</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProfileForDetail(p)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{p.fullName}</p>
                    {p.lastVisitDate && (
                      <p className="text-[10px] text-slate-400">
                        Última visita: {formatSpanishDate(p.lastVisitDate)}
                      </p>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{p.company}</td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 rounded-md text-[10px] font-bold border border-amber-200">
                      {p.accessType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200">
                      {p.idType}: {p.idNumber || "S/N"}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="text-slate-800 font-mono font-medium">{p.email || "Sin correo"}</p>
                    <p className="text-slate-500 text-[11px]">{p.phone || "Sin teléfono"}</p>
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {p.vehiclePlates ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-[11px]">
                        🚗 {p.vehiclePlates}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Peatonal</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full text-[11px]">
                      {p.totalVisits || 0} {p.totalVisits === 1 ? "Visita" : "Visitas"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Editar Datos del Visitante"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar del Padrón"
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

      {/* DETAIL MODAL */}
      {selectedProfileForDetail && (
        <AdminVisitorProfileDetailModal
          profile={selectedProfileForDetail}
          visitorsHistory={visitors}
          onClose={() => setSelectedProfileForDetail(null)}
          onEdit={(p) => {
            setSelectedProfileForDetail(null);
            handleOpenEdit(p);
          }}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingProfile ? "Editar Visitante en Padrón" : "Registrar Nuevo Visitante en Padrón"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Ing. Roberto Carlos Méndez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa / Procedencia *</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ej. Siemens Energy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría Habitual</label>
                  <select
                    value={formAccessType}
                    onChange={(e) => setFormAccessType(e.target.value as AccessType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="Visita General">Visita General</option>
                    <option value="Contratista">Contratista</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Entrevista">Entrevista</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="visitante@empresa.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Identificación</label>
                  <select
                    value={formIdType}
                    onChange={(e) => setFormIdType(e.target.value as IdType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="INE">INE / IFE</option>
                    <option value="Licencia">Licencia de Conducir</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Gafete">Gafete Corporativo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Folio / Número de ID</label>
                  <input
                    type="text"
                    value={formIdNumber}
                    onChange={(e) => setFormIdNumber(e.target.value)}
                    placeholder="Ej. INE1234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Placas de Vehículo (Opcional)</label>
                  <input
                    type="text"
                    value={formVehiclePlates}
                    onChange={(e) => setFormVehiclePlates(e.target.value)}
                    placeholder="Ej. ABC-123-D"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Observaciones de seguridad, empresa contratante o equipo habitual..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow"
                >
                  Guardar en Padrón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
