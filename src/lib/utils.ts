import { AuditLog, Visitor } from "../types";

/**
 * Cleans development domain prefix 'ais-dev-' to 'ais-pre-' for public sharing,
 * and sets mode=visitor#preregister
 */
export function getCleanPublicVisitorUrl(hostId?: string): string {
  let origin = window.location.origin;

  // Replace ais-dev- with ais-pre- for shared preview links as requested
  if (origin.includes("ais-dev-")) {
    origin = origin.replace("ais-dev-", "ais-pre-");
  }

  let url = `${origin}/?mode=visitor`;
  if (hostId) {
    url += `&hostId=${encodeURIComponent(hostId)}`;
  }
  url += `#preregister`;
  return url;
}

/**
 * Generates unique QR Folio (e.g., FOL-2026-X892)
 */
export function generateQRFolio(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `FOL-${year}-${randomChars}`;
}

/**
 * Formats ISO date to Spanish readable text
 */
export function formatSpanishDate(isoDateString?: string): string {
  if (!isoDateString) return "No registrado";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Format time only
 */
export function formatSpanishTime(isoDateString?: string): string {
  if (!isoDateString) return "--:--";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "--:--";
  }
}

/**
 * Formats WhatsApp text message and opens URL
 */
export function generateWhatsAppLink(visitor: Visitor, passUrl?: string): string {
  const link = passUrl || getCleanPublicVisitorUrl();
  const text =
    `*SISTEMA DE CONTROL DE ACCESO - PASE DIGITAL*\n\n` +
    `📌 *Visitante:* ${visitor.fullName}\n` +
    `🏢 *Empresa:* ${visitor.company}\n` +
    `🏷️ *Tipo:* ${visitor.accessType}\n` +
    `🆔 *Folio QR:* ${visitor.qrFolio}\n` +
    `👤 *Anfitrión:* ${visitor.hostName} (${visitor.department})\n` +
    `📅 *Fecha Cita:* ${formatSpanishDate(visitor.scheduledDateTime)}\n` +
    `📍 *Zona:* ${visitor.zone}\n` +
    `✅ *Estado:* ${visitor.status}\n\n` +
    `Ver mi Pase Digital con QR aquí:\n${link}`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Generates mailto URL for visitor status notification (Pending, Approved, Rejected, Cancelled)
 */
export function generateVisitorStatusMailto(
  visitor: Visitor,
  status: Visitor["status"],
  reason?: string
): string {
  const passUrl = getCleanPublicVisitorUrl();
  let subject = "";
  let body = "";

  if (status === "APPROVED") {
    subject = `✅ Cita APROBADA - Pase Digital de Acceso Folio ${visitor.qrFolio}`;
    body =
      `Estimado(a) ${visitor.fullName},\n\n` +
      `Nos complace informarle que su solicitud de visita con ${visitor.hostName} (${visitor.department}) ha sido APROBADA.\n\n` +
      `Detalles de su Acceso:\n` +
      `- Folio QR: ${visitor.qrFolio}\n` +
      `- Tipo de Visita: ${visitor.accessType}\n` +
      `- Empresa: ${visitor.company}\n` +
      `- Fecha y Hora: ${formatSpanishDate(visitor.scheduledDateTime)}\n` +
      `- Zona de Planta: ${visitor.zone}\n\n` +
      `Por favor presente este Folio o su Pase Digital con Código QR en la Caseta de Vigilancia acompañado de su identificación oficial (${visitor.idType}).\n\n` +
      `Consulte su pase digital en el siguiente enlace:\n${passUrl}\n\n` +
      `Atentamente,\n${visitor.hostName}\nControl de Acceso Industrial`;
  } else if (status === "REJECTED") {
    subject = `❌ Cita NO APROBADA - Folio ${visitor.qrFolio}`;
    body =
      `Estimado(a) ${visitor.fullName},\n\n` +
      `Le informamos que su solicitud de visita con ${visitor.hostName} no pudo ser aprobada.\n\n` +
      `Motivo: ${reason || visitor.rejectionReason || "Sin disponibilidad de agenda"}\n\n` +
      `Si requiere reprogramar su cita, por favor póngase en contacto directamente con el anfitrión.\n\n` +
      `Atentamente,\n${visitor.hostName}`;
  } else if (status === "CANCELLED") {
    subject = `⚠️ Cita CANCELADA - Folio ${visitor.qrFolio}`;
    body =
      `Estimado(a) ${visitor.fullName},\n\n` +
      `Le informamos que su cita programada para el ${formatSpanishDate(visitor.scheduledDateTime)} con ${visitor.hostName} ha sido CANCELADA.\n\n` +
      `Motivo de Cancelación: ${reason || visitor.cancellationReason || "Reprogramación interna"}\n\n` +
      `Atentamente,\n${visitor.hostName}\nControl de Acceso Industrial`;
  } else {
    subject = `⏳ Cita RECIBIDA - En Espera de Aprobación - Folio ${visitor.qrFolio}`;
    body =
      `Estimado(a) ${visitor.fullName},\n\n` +
      `Su solicitud de pre-registro ha sido recibida exitosamente con Folio: ${visitor.qrFolio}.\n\n` +
      `Actualmente se encuentra PENDIENTE de autorización por su anfitrión (${visitor.hostName}). Tan pronto como sea autorizada, recibirá la confirmación con su código QR para el ingreso a planta.\n\n` +
      `Gracias por su registro.\nControl de Acceso Industrial`;
  }

  return `mailto:${visitor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function generateMailtoLink(visitor: Visitor, passUrl: string): string {
  return generateVisitorStatusMailto(visitor, visitor.status);
}

export function generateHostDecisionMailto(
  visitor: Visitor,
  decision: "APPROVED" | "REJECTED" | "CANCELLED",
  reason?: string
): string {
  return generateVisitorStatusMailto(visitor, decision as Visitor["status"], reason);
}

/**
 * Export array of AuditLog to CSV downloadable format with full visitor & host details
 */
export function exportAuditLogsToCSV(logs: AuditLog[], visitorsList: Visitor[] = []): void {
  const visitorsMap = new Map<string, Visitor>();
  visitorsList.forEach(v => {
    if (v.id) visitorsMap.set(v.id, v);
    if (v.fullName) visitorsMap.set(v.fullName.toLowerCase(), v);
  });

  const headers = [
    "ID Log",
    "Fecha y Hora Evento",
    "Canal / Origen",
    "Accion",
    "Realizado Por (Actor)",
    "Nombre Visitante",
    "Empresa / Procedencia",
    "Tipo de Acceso",
    "Documento ID",
    "Telefono Visitante",
    "Correo Visitante",
    "Folio QR",
    "Gafete Asignado",
    "Placas Vehiculo",
    "Acompanantes",
    "Nombre Anfitrion",
    "Departamento Anfitrion",
    "Correo Anfitrion",
    "Fecha Cita Programada",
    "Hora Check-In (Entrada)",
    "Hora Check-Out (Salida)",
    "Tiempo en Planta",
    "Detalles / Observaciones"
  ];

  const rows = logs.map((l) => {
    const matchedVisitor = l.visitorId ? visitorsMap.get(l.visitorId) : (l.visitorName ? visitorsMap.get(l.visitorName.toLowerCase()) : undefined);

    const originLabel = l.origin === 'CASETA' ? 'Caseta (Registro Express)' :
      l.origin === 'WEB_PREREGISTER' ? 'Portal Web (Pre-Registro)' :
      l.origin === 'HOST_PORTAL' ? 'Portal Anfitrion' :
      l.origin === 'ADMIN_PORTAL' ? 'Administracion' :
      (l.action === 'EXPRESS_REGISTER' ? 'Caseta (Registro Express)' :
       l.action === 'PRE_REGISTER' ? 'Portal Web (Pre-Registro)' :
       l.action === 'CHECK_IN' || l.action === 'CHECK_OUT' ? 'Caseta' : 'Sistema');

    const company = l.company || matchedVisitor?.company || "";
    const accessType = l.accessType || matchedVisitor?.accessType || "";
    const idDoc = (l.idType || matchedVisitor?.idType || "") + (l.idNumber || matchedVisitor?.idNumber ? `: ${l.idNumber || matchedVisitor?.idNumber}` : "");
    const phone = l.visitorPhone || matchedVisitor?.phone || "";
    const email = l.visitorEmail || matchedVisitor?.email || "";
    const qrFolio = l.qrFolio || matchedVisitor?.qrFolio || "";
    const badge = l.badgeNumber || matchedVisitor?.badgeNumber || "";
    const plates = l.vehiclePlates || matchedVisitor?.vehiclePlates || "";
    const companions = l.companionsSummary || (matchedVisitor?.companions ? matchedVisitor.companions.map(c => c.fullName).join("; ") : "");
    const hostName = l.hostName || matchedVisitor?.hostName || "";
    const hostDept = l.hostDepartment || matchedVisitor?.department || "";
    const hostEmail = l.hostEmail || matchedVisitor?.hostEmail || "";
    const scheduled = formatSpanishDate(l.scheduledDateTime || matchedVisitor?.scheduledDateTime);
    const checkIn = formatSpanishDate(l.checkInTime || matchedVisitor?.checkInTime);
    const checkOut = formatSpanishDate(l.checkOutTime || matchedVisitor?.checkOutTime);

    let durationText = "";
    if (l.durationMinutes) {
      const hrs = Math.floor(l.durationMinutes / 60);
      const mins = l.durationMinutes % 60;
      durationText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
    } else if ((l.checkInTime || matchedVisitor?.checkInTime) && (l.checkOutTime || matchedVisitor?.checkOutTime)) {
      const inT = new Date(l.checkInTime || matchedVisitor!.checkInTime!).getTime();
      const outT = new Date(l.checkOutTime || matchedVisitor!.checkOutTime!).getTime();
      if (outT > inT) {
        const diffMins = Math.round((outT - inT) / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        durationText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
      }
    } else if ((l.checkInTime || matchedVisitor?.checkInTime) && (!l.checkOutTime && !matchedVisitor?.checkOutTime)) {
      durationText = "Actualmente en Planta";
    }

    return [
      `"${l.id}"`,
      `"${formatSpanishDate(l.timestamp)}"`,
      `"${originLabel}"`,
      `"${l.action}"`,
      `"${(l.performedBy || "").replace(/"/g, '""')}"`,
      `"${(l.visitorName || matchedVisitor?.fullName || "").replace(/"/g, '""')}"`,
      `"${company.replace(/"/g, '""')}"`,
      `"${accessType.replace(/"/g, '""')}"`,
      `"${idDoc.replace(/"/g, '""')}"`,
      `"${phone.replace(/"/g, '""')}"`,
      `"${email.replace(/"/g, '""')}"`,
      `"${qrFolio.replace(/"/g, '""')}"`,
      `"${badge.replace(/"/g, '""')}"`,
      `"${plates.replace(/"/g, '""')}"`,
      `"${companions.replace(/"/g, '""')}"`,
      `"${hostName.replace(/"/g, '""')}"`,
      `"${hostDept.replace(/"/g, '""')}"`,
      `"${hostEmail.replace(/"/g, '""')}"`,
      `"${scheduled}"`,
      `"${checkIn}"`,
      `"${checkOut}"`,
      `"${durationText}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`
    ];
  });

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Bitacora_Acceso_Detallada_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

