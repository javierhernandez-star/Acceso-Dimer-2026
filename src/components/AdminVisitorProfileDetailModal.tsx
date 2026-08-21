import React from "react";
import { VisitorProfile, Visitor } from "../types";
import { formatSpanishDate } from "../lib/utils";
import { GuardComplianceAlertBanner } from "./GuardComplianceAlertBanner";
import {
  X,
  UserCheck,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Car,
  Calendar,
  Clock,
  Shield,
  Edit2,
  FileText,
  History
} from "lucide-react";

interface AdminVisitorProfileDetailModalProps {
  profile: VisitorProfile;
  visitorsHistory?: Visitor[];
  onClose: () => void;
  onEdit: (profile: VisitorProfile) => void;
}

export const AdminVisitorProfileDetailModal: React.FC<AdminVisitorProfileDetailModalProps> = ({
  profile,
  visitorsHistory = [],
  onClose,
  onEdit
}) => {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Visits made by this visitor
  const pastVisits = visitorsHistory.filter(
    (v) =>
      (v.idNumber && profile.idNumber && v.idNumber.toLowerCase() === profile.idNumber.toLowerCase()) ||
      (v.fullName && v.fullName.toLowerCase() === profile.fullName.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase">
              {profile.accessType || "Visita General"}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-lg">
              {profile.totalVisits || pastVisits.length || 0} Visitas Registradas
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {profile.fullName}
          </h2>
          <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">{profile.company}</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Compliance and Expiration Status Banner */}
          <GuardComplianceAlertBanner visitor={profile} />

          {/* Contact and ID Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" /> Identificación Oficial:
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {profile.idType || "INE"}: {profile.idNumber || "No especificado"}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-600" /> Vehículo / Placas:
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {profile.vehiclePlates ? `🚗 ${profile.vehiclePlates}` : "Peatonal / Sin vehículo"}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-600" /> Correo Electrónico:
              </span>
              <p className="font-mono font-bold text-slate-900 text-xs truncate">
                {profile.email || "Sin correo"}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-600" /> Teléfono de Contacto:
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {profile.phone || "Sin teléfono"}
              </p>
            </div>
          </div>

          {/* Notes or comments */}
          {profile.notes && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1">
              <span className="text-amber-900 font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> Observaciones del Padrón:
              </span>
              <p className="text-slate-800 italic">{profile.notes}</p>
            </div>
          )}

          {/* Visit History Section */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>Historial de Citas e Ingresos a Planta ({pastVisits.length})</span>
            </h4>

            {pastVisits.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                No hay historial de citas previas registradas en el sistema para este visitante.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pastVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{formatSpanishDate(v.scheduledDateTime)}</p>
                      <p className="text-[11px] text-slate-500">
                        Anfitrión: <strong>{v.hostName}</strong> ({v.department})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {v.qrFolio}
                      </span>
                      {v.badgeNumber && (
                        <p className="text-[10px] text-blue-700 font-mono font-extrabold mt-0.5">
                          Gafete: {v.badgeNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onEdit(profile);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar Datos de Visitante</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl transition-colors"
          >
            ← Regresar
          </button>
        </div>
      </div>
    </div>
  );
};
