import React from "react";
import { Host, Visitor } from "../types";
import { User, Phone, Mail, Building2, Shield, Briefcase, CheckCircle2, Clock, CalendarPlus, X } from "lucide-react";

interface HostCardModalProps {
  host: Host;
  visitors?: Visitor[];
  onClose: () => void;
  onSelectHostForAppointment?: (hostId: string) => void;
}

export const HostCardModal: React.FC<HostCardModalProps> = ({
  host,
  visitors = [],
  onClose,
  onSelectHostForAppointment
}) => {
  // Count active visits
  const hostVisits = visitors.filter((v) => v.hostId === host.id);
  const activeInPlant = hostVisits.filter((v) => v.status === "CHECKED_IN").length;
  const approvedUpcoming = hostVisits.filter((v) => v.status === "APPROVED").length;
  const pendingRequests = hostVisits.filter((v) => v.status === "PENDING").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/40 border-2 border-indigo-400/40 flex items-center justify-center text-amber-300 text-2xl font-black shadow-inner">
              {host.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                  {host.role === "ADMIN" ? "👑 Administrador" : host.role === "GUARD" ? "🛡️ Guardia" : "👤 Anfitrión"}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  ● {host.status === "ACTIVE" ? "Activo en Planta" : "Inactivo"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 leading-snug">{host.fullName}</h3>
              <p className="text-xs text-indigo-200">{host.position || "Personal Autorizado"}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Contact Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Building2 className="w-4 h-4 text-indigo-600" /> Departamento:
              </span>
              <span className="font-bold text-slate-900">{host.department}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Phone className="w-4 h-4 text-indigo-600" /> Teléfono / Extensión:
              </span>
              <span className="font-mono font-bold text-indigo-950 text-sm">{host.phone}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Mail className="w-4 h-4 text-indigo-600" /> Correo Institucional:
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[200px]">{host.email}</span>
            </div>
          </div>

          {/* Active Citas Summary */}
          <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Estatus Actual de Citas:</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <p className="text-lg font-black text-emerald-600">{activeInPlant}</p>
                <p className="text-[10px] text-slate-500 font-semibold">En Planta</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <p className="text-lg font-black text-blue-600">{approvedUpcoming}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Programadas</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <p className="text-lg font-black text-amber-600">{pendingRequests}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Por Aprobar</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {onSelectHostForAppointment && (
              <button
                onClick={() => {
                  onSelectHostForAppointment(host.id);
                  onClose();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CalendarPlus className="w-4 h-4 text-amber-400" />
                <span>Agendar Pre-Registro con {host.fullName.split(" ")[0]}</span>
              </button>
            )}

            <div className="flex gap-2">
              <a
                href={`tel:${host.phone}`}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar</span>
              </a>

              <a
                href={`mailto:${host.email}`}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors text-center flex items-center justify-center gap-1.5 border border-slate-300"
              >
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                <span>Correo</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
