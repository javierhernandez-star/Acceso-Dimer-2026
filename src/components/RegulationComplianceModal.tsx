import React, { useState, useRef, useEffect } from "react";
import { ComplianceRecord, AccessType } from "../types";
import { getCategoryInfo, COMPLIANCE_TEXTS } from "../lib/compliance";
import { ShieldCheck, BookOpen, CheckCircle2, Lock, FileText, AlertCircle, ArrowDown } from "lucide-react";

interface RegulationComplianceModalProps {
  accessType: AccessType;
  visitorEmail?: string;
  visitorName?: string;
  onAccept: (compliance: ComplianceRecord) => void;
  onClose: () => void;
}

export const RegulationComplianceModal: React.FC<RegulationComplianceModalProps> = ({
  accessType,
  visitorEmail,
  visitorName,
  onAccept,
  onClose
}) => {
  const category = getCategoryInfo(accessType);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [userIp, setUserIp] = useState<string>("127.0.0.1 (Web Portal Client)");
  const [acknowledgedCheck, setAcknowledgedCheck] = useState(false);

  // Fetch approximate client IP for compliance audit record
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) setUserIp(data.ip);
      })
      .catch(() => {
        // Fallback gracefully
        setUserIp("IP-Segura-Portal");
      });
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Condition of scroll: user must scroll to bottom within 25px threshold
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 25;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleConfirmAcceptance = () => {
    if (!hasScrolledToBottom || !acknowledgedCheck) return;

    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + category.validityDays);

    const complianceData: ComplianceRecord = {
      version_doc: category.ruleBookVersion,
      fecha_aceptacion: now.toISOString(),
      ip_usuario: userIp,
      fecha_expiracion_induccion: expirationDate.toISOString(),
      regulationType: category.regulationType,
      acceptedByEmail: visitorEmail || "no-reply@visitante.local"
    };

    onAccept(complianceData);
  };

  const regulationText = COMPLIANCE_TEXTS[category.categoryKey] || COMPLIANCE_TEXTS.GENERAL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Compliance Oficial & Seguridad EHS</span>
            </span>
            <span className="bg-white/10 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded-md">
              Doc: {category.ruleBookVersion}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
            {category.ruleBookTitle}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Perfil: <strong className="text-white">{category.title}</strong> • Vigencia de inducción: {category.validityDays} días
          </p>
        </div>

        {/* Notice to scroll */}
        {!hasScrolledToBottom && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Por favor despliegue y lea el documento completo hasta el final para habilitar la firma.</span>
            </span>
            <span className="text-[10px] bg-amber-200/70 text-amber-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowDown className="w-3 h-3 animate-bounce" /> Scroll Requerido
            </span>
          </div>
        )}

        {/* Scrollable Document Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="p-5 sm:p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans space-y-4 bg-slate-50 flex-1 border-b border-slate-200 select-none"
          style={{ minHeight: "260px", maxHeight: "360px" }}
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {category.ruleBookTitle}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Versión Oficial: {category.ruleBookVersion} • Norma de Seguridad y Control de Acceso
              </p>
            </div>

            <div className="whitespace-pre-line font-medium text-slate-700 text-xs">
              {regulationText}
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 mt-4">
              <p className="font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Registro Inmutable de Conformidad:
              </p>
              <p className="mt-0.5 text-slate-600">
                Al confirmar, se registrará la versión <code className="font-mono font-bold text-slate-800">{category.ruleBookVersion}</code>, timestamp de alta resolución y dirección IP ({userIp}) como constancia de entrega y aceptación.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Checkbox and Submit Button */}
        <div className="p-5 sm:p-6 bg-white space-y-4 shrink-0">
          <label
            className={`flex items-start space-x-3 text-xs font-semibold select-none cursor-pointer ${
              !hasScrolledToBottom ? "opacity-50 pointer-events-none text-slate-400" : "text-slate-800"
            }`}
          >
            <input
              type="checkbox"
              disabled={!hasScrolledToBottom}
              checked={acknowledgedCheck}
              onChange={(e) => setAcknowledgedCheck(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>
              He leído en su totalidad y acepto cumplir estrictamente las normas de seguridad industrial, conducta y confidencialidad estipuladas en este reglamento.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              Regresar / Cancelar
            </button>

            <button
              type="button"
              disabled={!hasScrolledToBottom || !acknowledgedCheck}
              onClick={handleConfirmAcceptance}
              className={`flex-1 py-2.5 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                hasScrolledToBottom && acknowledgedCheck
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acepto haber leído el reglamento y Continuar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
