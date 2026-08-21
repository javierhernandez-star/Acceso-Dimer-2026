import React from "react";
import { Visitor, VisitorProfile, DocumentValidityStatus } from "../types";
import { evaluateVisitorValidity } from "../lib/compliance";
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2, FileWarning, Clock } from "lucide-react";

interface GuardComplianceAlertBannerProps {
  visitor: Visitor | VisitorProfile;
  compact?: boolean;
}

export const GuardComplianceAlertBanner: React.FC<GuardComplianceAlertBannerProps> = ({
  visitor,
  compact = false
}) => {
  const validity: DocumentValidityStatus = evaluateVisitorValidity(visitor);

  if (validity.isValidOverall && validity.warnings.length === 0 && validity.missingPerVisitDocs.length === 0) {
    if (compact) return null;
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 font-semibold">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Vigencia Documental y Seguridad EHS en Regla (Sin alertas)</span>
        </span>
        <span className="text-[10px] bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
          Autorizado
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {validity.complianceExpired && (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>Inducción Vencida</span>
          </span>
        )}
        {!validity.isImssValid && (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>IMSS Vencido</span>
          </span>
        )}
        {!validity.isNdaValid && (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <FileWarning className="w-3 h-3 text-rose-600" />
            <span>NDA Vencido</span>
          </span>
        )}
        {!validity.isInsuranceValid && (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <FileWarning className="w-3 h-3 text-rose-600" />
            <span>Póliza Seguro Vencida</span>
          </span>
        )}
        {validity.missingPerVisitDocs.length > 0 && (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Falta AST / Remisión</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs text-rose-950 space-y-2">
      <div className="flex items-center justify-between border-b border-rose-200 pb-2">
        <span className="font-extrabold flex items-center gap-1.5 text-rose-900 text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
          <span>ALERTA DE SEGURIDAD / DOCUMENTACIÓN VENCIDA O INCOMPLETA</span>
        </span>
        <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
          Revisar antes de Entrada
        </span>
      </div>

      <div className="space-y-1.5">
        {validity.issues.map((issue, idx) => (
          <p key={idx} className="flex items-start gap-1.5 font-bold text-rose-900">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span>{issue}</span>
          </p>
        ))}

        {validity.missingPerVisitDocs.map((doc, idx) => (
          <p key={idx} className="flex items-start gap-1.5 font-semibold text-amber-900">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>Falta validar documento requerido por cita: <strong>{doc}</strong></span>
          </p>
        ))}

        {validity.warnings.map((warn, idx) => (
          <p key={idx} className="flex items-start gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{warn}</span>
          </p>
        ))}
      </div>
    </div>
  );
};
