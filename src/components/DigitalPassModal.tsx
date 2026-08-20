import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Share2, Mail, Download, CheckCircle, Clock, AlertTriangle, Building, MapPin, User, Calendar, Shield, Loader2, Check } from "lucide-react";
import { Visitor } from "../types";
import { formatSpanishDate, generateWhatsAppLink, generateMailtoLink, getCleanPublicVisitorUrl } from "../lib/utils";
import { sendNoReplyEmailNotification } from "../lib/notifications";

interface DigitalPassModalProps {
  visitor: Visitor;
  onClose: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({ visitor, onClose }) => {
  const passRef = useRef<HTMLDivElement>(null);
  const passPublicUrl = getCleanPublicVisitorUrl(visitor.hostId);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);

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

  const handleSendEmailNow = async () => {
    if (!visitor.email) {
      alert("No hay un correo registrado para este visitante.");
      return;
    }
    setIsSendingEmail(true);
    setEmailSentStatus(null);
    try {
      const eventType = visitor.status === "APPROVED" ? "APROBACION" : "SOLICITUD";
      await sendNoReplyEmailNotification(eventType, visitor);
      setEmailSentStatus(`¡Pase enviado a ${visitor.email}!`);
      setTimeout(() => setEmailSentStatus(null), 4000);
    } catch (e: any) {
      console.warn("Could not send automated email:", e);
      // Fallback to mailto
      window.location.href = generateMailtoLink(visitor, passPublicUrl);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadge = (status: Visitor["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aprobado / Listo para Ingreso
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendiente de Aprobación
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-300">
            <Shield className="w-3.5 h-3.5 text-blue-600" /> En Planta (Gafete {visitor.badgeNumber || "Asignado"})
          </span>
        );
      case "CHECKED_OUT":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300">
            Salida Registrada
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> No Aprobado
          </span>
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-8">
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Control de Acceso Industrial</span>
          </div>
          <h2 className="text-xl font-bold text-white">Pase Digital de Acceso</h2>
          <p className="text-xs text-slate-300">Presente este código QR en Caseta de Vigilancia</p>
        </div>

        {/* Printable Pass Body */}
        <div ref={passRef} className="p-6 space-y-5 bg-white print:p-8">
          {/* Status Badge */}
          <div className="text-center">
            {getStatusBadge(visitor.status)}
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              <QRCodeSVG
                value={visitor.qrFolio}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
              FOLIO QR
            </p>
            <p className="text-lg font-extrabold text-blue-950 font-mono tracking-wider">
              {visitor.qrFolio}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-sm border-t border-slate-100 pt-3">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" /> Visitante:
              </span>
              <span className="font-bold text-slate-900 text-right">{visitor.fullName}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Empresa:
              </span>
              <span className="font-semibold text-slate-800 text-right">{visitor.company}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" /> Anfitrión:
              </span>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{visitor.hostName}</p>
                <p className="text-xs text-slate-500">{visitor.department}</p>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Cita Programada:
              </span>
              <span className="font-semibold text-blue-900 text-right">
                {formatSpanishDate(visitor.scheduledDateTime)}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Zona de Acceso:
              </span>
              <span className="font-semibold text-slate-800 text-right">{visitor.zone}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                🆔 Identificación:
              </span>
              <span className="text-slate-700 text-right">
                {visitor.idType} ({visitor.idNumber})
              </span>
            </div>

            {visitor.vehiclePlates && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                  🚘 Placas Vehículo:
                </span>
                <span className="font-mono font-bold text-slate-800">{visitor.vehiclePlates}</span>
              </div>
            )}

            {visitor.companions && visitor.companions.length > 0 && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 flex items-center justify-between">
                  <span>👥 Acompañantes ({visitor.companions.length}):</span>
                </span>
                <div className="space-y-1 text-[11px] text-slate-600 divide-y divide-slate-200/60">
                  {visitor.companions.map((comp, idx) => (
                    <div key={idx} className="pt-1 first:pt-0 flex justify-between">
                      <span className="font-semibold text-slate-900">{comp.fullName}</span>
                      <span className="font-mono text-slate-500">{comp.idNumber || "Sin ID"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visitor.badgeNumber && (
              <div className="flex items-start justify-between bg-blue-50 p-2 rounded-lg border border-blue-200">
                <span className="text-blue-700 font-semibold text-xs">Gafete Asignado:</span>
                <span className="font-mono font-black text-blue-950">{visitor.badgeNumber}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
            Presente identificación oficial vigente con fotografía en la entrada.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          {emailSentStatus && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{emailSentStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={generateWhatsAppLink(visitor, passPublicUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </a>

            <button
              onClick={handleSendEmailNow}
              disabled={isSendingEmail}
              className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              <span>{isSendingEmail ? "Enviando..." : "Enviar a mi Correo"}</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium py-2.5 px-3 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors border border-slate-300"
          >
            <span>← Regresar a la Pantalla Anterior</span>
          </button>
        </div>
      </div>
    </div>
  );
};
