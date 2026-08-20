import React from "react";
import { Visitor, Host } from "../types";
import { formatSpanishDate, formatSpanishTime } from "../lib/utils";
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Car,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  LogOut,
  QrCode,
  Edit2,
  Users,
  Briefcase,
  HardHat,
  Truck,
  FileText,
  AlertTriangle,
  Laptop
} from "lucide-react";

interface GuardVisitorDetailModalProps {
  visitor: Visitor;
  hosts: Host[];
  onClose: () => void;
  onCheckIn: (visitor: Visitor) => void;
  onCheckOut: (visitor: Visitor) => void;
  onViewPass: (visitor: Visitor) => void;
  onEdit: (visitor: Visitor) => void;
  onSelectHost?: (host: Host) => void;
}

export const GuardVisitorDetailModal: React.FC<GuardVisitorDetailModalProps> = ({
  visitor,
  hosts,
  onClose,
  onCheckIn,
  onCheckOut,
  onViewPass,
  onEdit,
  onSelectHost
}) => {
  const hostObj = hosts.find((h) => h.id === visitor.hostId || h.fullName === visitor.hostName);

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

  const getStatusBadge = (status: Visitor["status"]) => {
    switch (status) {
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm animate-pulse">
            <Shield className="w-3.5 h-3.5" /> En Planta (Gafete {visitor.badgeNumber || "Asignado"})
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada / Lista para Entrada
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <Clock className="w-3.5 h-3.5" /> Pendiente de Aprobación por Anfitrión
          </span>
        );
      case "CHECKED_OUT":
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <LogOut className="w-3.5 h-3.5" /> Salida Completada
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Cita Rechazada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Cerrar Ficha"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getStatusBadge(visitor.status)}
            <span className="bg-blue-900/80 text-blue-200 border border-blue-700 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg">
              Folio: {visitor.qrFolio}
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase">
              {visitor.accessType}
            </span>
            {visitor.isExpress && (
              <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                ⚡ Registro Exprés
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {visitor.fullName}
          </h2>
          <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">{visitor.company}</span>
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {visitor.badgeNumber && (
              <div className="bg-blue-100 border border-blue-300 text-blue-900 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 font-mono">
                <span>🏷️ Gafete Activo:</span>
                <span className="text-sm font-black text-blue-950">{visitor.badgeNumber}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {visitor.status === "APPROVED" && (
              <button
                onClick={() => {
                  onClose();
                  onCheckIn(visitor);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Entrada / Gafete</span>
              </button>
            )}

            {visitor.status === "CHECKED_IN" && (
              <button
                onClick={() => {
                  onClose();
                  onCheckOut(visitor);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Registrar Salida</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onViewPass(visitor);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Ver Pase QR</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(visitor);
              }}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Scrollable Detailed Sections */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Grid: Visitor Info & Host Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visitor Contact & ID Card */}
            <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Datos del Visitante</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Documento Oficial:</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                    {visitor.idType}: {visitor.idNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-mono font-bold text-slate-900">{visitor.phone || "No registrado"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Correo:</span>
                  <span className="font-mono text-slate-800 text-[11px] truncate max-w-[180px]">{visitor.email}</span>
                </div>
                {visitor.vehiclePlates && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Vehículo / Placas:</span>
                    <span className="font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      🚗 {visitor.vehiclePlates}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Host & Location Card */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Anfitrión & Destino en Planta</span>
                </h4>
                {hostObj && onSelectHost && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectHost(hostObj);
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    Ver Tarjeta
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Anfitrión:</span>
                  <span className="font-bold text-indigo-950">{visitor.hostName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Departamento:</span>
                  <span className="font-semibold text-slate-800">{visitor.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Zona Autorizada:</span>
                  <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                    📍 {visitor.zone}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cita Programada:</span>
                  <span className="font-semibold text-slate-800">
                    {formatSpanishDate(visitor.scheduledDateTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category-Specific Operational Details */}
          {visitor.accessType === "Contratista" && (
            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-amber-950 text-xs flex items-center gap-2 border-b border-amber-200 pb-2">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>Requisitos de Seguridad Industrial (Contratista)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                  <p className="text-slate-500 text-[11px]">Orden de Trabajo / OT:</p>
                  <p className="font-mono font-bold text-slate-900">{visitor.workOrder || "N/A"}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                  <p className="text-slate-500 text-[11px]">Seguro Social / IMSS Vigente:</p>
                  <p className="font-bold text-emerald-700">{visitor.imssNumber || "Validado / Registrado"}</p>
                </div>
                {visitor.safetyEquipment && (
                  <div className="sm:col-span-2 bg-white p-2.5 rounded-xl border border-amber-100">
                    <p className="text-slate-500 text-[11px]">Equipo de Protección Personal (EPP):</p>
                    <p className="font-semibold text-slate-800">{visitor.safetyEquipment}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {visitor.accessType === "Proveedor" && (
            <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-blue-950 text-xs flex items-center gap-2 border-b border-blue-200 pb-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Información de Carga y Entrega (Proveedor)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                  <p className="text-slate-500 text-[11px]">No. Factura / Remisión / PO:</p>
                  <p className="font-mono font-bold text-slate-900">{visitor.purchaseOrder || "S/N"}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                  <p className="text-slate-500 text-[11px]">Tipo de Carga / Mercancía:</p>
                  <p className="font-semibold text-slate-900">{visitor.cargoType || "Materiales de Entrega"}</p>
                </div>
              </div>
            </div>
          )}

          {visitor.accessType === "Entrevista" && (
            <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-purple-950 text-xs flex items-center gap-2 border-b border-purple-200 pb-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>Detalles de Reclutamiento y Selección</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                  <p className="text-slate-500 text-[11px]">Puesto Solicitado:</p>
                  <p className="font-bold text-purple-950">{visitor.interviewPosition || "Candidato a Vacante"}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                  <p className="text-slate-500 text-[11px]">Entrevistador Asignado:</p>
                  <p className="font-semibold text-slate-900">{visitor.hostName} (RH)</p>
                </div>
              </div>
            </div>
          )}

          {/* Companions Breakdown */}
          {visitor.companions && visitor.companions.length > 0 && (
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-purple-950 text-xs flex items-center gap-2 border-b border-purple-100 pb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Acompañantes en el mismo grupo ({visitor.companions.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visitor.companions.map((c, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{c.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {c.idNumber || "Sin ID"}</p>
                    </div>
                    {c.badgeNumber && (
                      <span className="bg-purple-100 text-purple-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                        {c.badgeNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools / Equipment registered */}
          {visitor.tools && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-600" />
                <span>Equipo de Cómputo / Herramientas Declaradas</span>
              </h4>
              <p className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800">
                {visitor.tools}
              </p>
            </div>
          )}

          {/* Access Logs & Timeline */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-200 pb-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Cronología de Movimientos en Caseta</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Cita Creada</p>
                <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  {visitor.createdAt ? formatSpanishDate(visitor.createdAt) : "--"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Hora de Entrada</p>
                <p className="font-mono font-extrabold text-emerald-800 text-xs mt-0.5">
                  {visitor.checkInTime ? formatSpanishTime(visitor.checkInTime) : "No registrada"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] text-blue-700 font-bold uppercase">Hora de Salida</p>
                <p className="font-mono font-extrabold text-blue-800 text-xs mt-0.5">
                  {visitor.checkOutTime ? formatSpanishTime(visitor.checkOutTime) : "En planta"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Close */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
          >
            ← Cerrar Ficha y Regresar
          </button>
        </div>
      </div>
    </div>
  );
};
