import { Visitor, EmailNotificationLog } from "../types";
import { db, sanitizeForFirestore, addEmailTrigger, getCachedAppConfig } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { sendEmailViaGmailApi, getGmailUser, getGmailAccessToken } from "./googleAuth";

export async function sendEmailViaAppsScriptWebhook(
  webhookUrl: string,
  to: string,
  subject: string,
  htmlBody: string,
  senderName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      to,
      subject,
      htmlBody,
      name: senderName || "No-Reply Control de Acceso"
    });

    // Google Apps Script Web Apps receive plain text payload or form-urlencoded reliably across domains
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: payload
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error sending via Apps Script webhook:", err);
    return { success: false, error: err.message };
  }
}

export async function sendNoReplyEmailNotification(
  eventType: 'SOLICITUD' | 'APROBACION' | 'RECHAZO' | 'CANCELACION' | 'EXPRESS_CHECKIN',
  visitor: Visitor,
  extraMessage?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const dateStr = new Date(visitor.scheduledDateTime || Date.now()).toLocaleString("es-MX", {
    dateStyle: "full",
    timeStyle: "short"
  });

  const appConfig = getCachedAppConfig();
  const configuredEmail = appConfig.noReplyEmail || "no-reply@dimer.com.mx";
  const configuredSenderName = appConfig.noReplySenderName || "No-Reply Control de Acceso";
  const companyTitle = appConfig.companyName || "Planta Industrial Dimer";

  const standardFooter = `
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 24px 0 16px 0;" />
    <div style="text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #334155;">${configuredSenderName} • ${companyTitle}</p>
      <p style="margin: 0; font-style: italic;">Este es un correo automático generado por el Sistema de Control de Acceso (${configuredEmail}). Por favor no responda directamente a este mensaje.</p>
    </div>
  `;

  let subject = "";
  let visitorBodyHtml = "";
  let hostBodyHtml = "";

  switch (eventType) {
    case 'EXPRESS_CHECKIN':
      subject = `[No-Reply] Notificación de Ingreso en Caseta: ${visitor.fullName} (${visitor.company})`;
      visitorBodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #059669; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">¡Ingreso Registrado en Caseta!</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0;">Registro Exprés en Caseta de Vigilancia</p>
          </div>
          <p style="font-size: 15px; color: #334155;">Hola <strong>${visitor.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Su ingreso a <strong>${companyTitle}</strong> ha sido autorizado y registrado exitosamente desde la Caseta de Seguridad.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #166534; font-size: 13px;">DATOS DE INGRESO:</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Folio QR:</strong> ${visitor.qrFolio}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Gafete Asignado:</strong> ${visitor.badgeNumber || 'Visita General'}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Anfitrión:</strong> ${visitor.hostName} (${visitor.department})</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Zona:</strong> ${visitor.zone || 'Planta Principal'}</p>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">Recuerde portar su gafete de visibilidad en todo momento y devolverlo al retirarse en la caseta.</p>
          ${standardFooter}
        </div>
      `;

      hostBodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #047857; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">🔔 Su Visitante Ha Ingresado a Planta</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0;">Registro Exprés en Caseta</p>
          </div>
          <p style="font-size: 15px; color: #334155;">Estimado(a) <strong>${visitor.hostName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Le informamos que su visitante se encuentra en recepción / caseta y ha iniciado su ingreso a la planta.</p>
          
          <div style="background: #fffbeb; border-left: 4px solid #059669; padding: 14px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #065f46; font-size: 13px;">DETALLES DEL VISITANTE:</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Visitante:</strong> ${visitor.fullName}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Empresa:</strong> ${visitor.company}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Tipo:</strong> ${visitor.accessType}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Gafete No.:</strong> ${visitor.badgeNumber || 'Pendiente'}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #334155;">• <strong>Hora de Ingreso:</strong> ${dateStr}</p>
          </div>
          ${standardFooter}
        </div>
      `;
      break;

    case 'SOLICITUD':
      subject = `[No-Reply] 🔔 Nueva Solicitud de Cita por Autorizar: ${visitor.fullName} (${visitor.company})`;
      visitorBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #0f172a; color: #ffffff; padding: 18px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.5px;">${companyTitle}</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Notificación Automática de Registro de Cita</p>
          </div>
          
          <p style="font-size: 15px; color: #1e293b; margin-bottom: 8px;">Hola <strong>${visitor.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Hemos recibido exitosamente su solicitud de acceso a nuestras instalaciones. Su cita ha sido enviada al correo de su anfitrión (<strong>${visitor.hostName}</strong>) para su revisión y autorización.
          </p>
          
          <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e; font-size: 13px; text-transform: uppercase;">RESUMEN DE SU SOLICITUD:</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Folio QR:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${visitor.qrFolio}</span></p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Empresa:</strong> ${visitor.company}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Tipo de Acceso:</strong> ${visitor.accessType}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Anfitrión Asignado:</strong> ${visitor.hostName} (${visitor.department})</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Fecha y Hora Programada:</strong> ${dateStr}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Zona:</strong> ${visitor.zone || 'Planta Principal'}</p>
          </div>
          
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
              ℹ️ <strong>¿Qué sigue?</strong> Tan pronto como <strong>${visitor.hostName}</strong> apruebe su cita, recibirá un segundo correo automático con su <strong>Pase Digital de Acceso y Código QR activo</strong> para ingresar directamente en Caseta de Vigilancia.
            </p>
          </div>

          ${standardFooter}
        </div>
      `;

      hostBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #1e293b; color: #ffffff; padding: 18px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">🔔 Nueva Solicitud de Cita Pendiente</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Sistema de Control de Acceso • Acción Requerida</p>
          </div>
          
          <p style="font-size: 15px; color: #1e293b;">Hola <strong>${visitor.hostName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Tiene una nueva visita programada a su nombre que requiere de su autorización para permitir el ingreso en la Caseta de Vigilancia.
          </p>
          
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e; font-size: 13px; text-transform: uppercase;">DETALLES DEL VISITANTE:</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Nombre del Visitante:</strong> <strong>${visitor.fullName}</strong></p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Empresa / Procedencia:</strong> ${visitor.company}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Tipo de Acceso:</strong> <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${visitor.accessType}</span></p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Teléfono de Contacto:</strong> ${visitor.phone || 'No especificado'}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Correo del Visitante:</strong> ${visitor.email || 'No especificado'}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Fecha y Hora:</strong> ${dateStr}</p>
            <p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Zona Requerida:</strong> ${visitor.zone || 'Planta Principal'}</p>
            ${visitor.vehiclePlates ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Vehículo / Placas:</strong> ${visitor.vehiclePlates}</p>` : ''}
            ${visitor.generalDetails?.visitReason ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;">• <strong>Motivo de Visita:</strong> ${visitor.generalDetails.visitReason}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para autorizar o rechazar esta visita, ingrese a su Bandeja de Anfitrión con su NIP de empleado:</p>
            <div style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; text-decoration: none;">
              Gestionar en Portal de Anfitrión
            </div>
          </div>
          ${standardFooter}
        </div>
      `;
      break;

    case 'APROBACION':
      subject = `[No-Reply] ✅ ¡Cita APROBADA! Acceso Autorizado - Folio ${visitor.qrFolio}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(visitor.qrFolio)}`;
      
      visitorBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #059669; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 20px;">¡CITA APROBADA Y AUTORIZADA!</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">Pase Digital de Acceso a ${companyTitle}</p>
          </div>
          
          <p style="font-size: 15px; color: #1e293b;">Estimado(a) <strong>${visitor.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Su anfitrión <strong>${visitor.hostName}</strong> ha <strong>APROBADO</strong> su visita. A continuación se encuentra su Pase Digital y Código QR para acceder en la Caseta de Vigilancia.
          </p>
          
          <!-- QR Card Pass Container -->
          <div style="background: #f8fafc; border: 2px solid #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">SU CÓDIGO QR DE ACCESO:</p>
            <div style="margin: 12px 0;">
              <img src="${qrImageUrl}" alt="Código QR de Acceso ${visitor.qrFolio}" width="180" height="180" style="border: 4px solid #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
            </div>
            <p style="margin: 0; font-family: monospace; font-size: 20px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">
              ${visitor.qrFolio}
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">
              Muestre este código directamente en la pantalla de su teléfono al guardia de seguridad.
            </p>
          </div>

          <!-- Appointment Summary -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 3px 0; color: #334155;">• <strong>Anfitrión:</strong> ${visitor.hostName} (${visitor.department})</p>
            <p style="margin: 3px 0; color: #334155;">• <strong>Fecha y Hora:</strong> ${dateStr}</p>
            <p style="margin: 3px 0; color: #334155;">• <strong>Área de Destino:</strong> ${visitor.zone || 'Planta Principal'}</p>
            <p style="margin: 3px 0; color: #334155;">• <strong>Empresa:</strong> ${visitor.company}</p>
          </div>

          <!-- Industrial Safety Requirements -->
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #92400e; text-transform: uppercase;">⚠️ REQUISITOS OBLIGATORIOS DE INGRESO:</p>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #78350f; line-height: 1.5;">
              <li>Presentar <strong>Identificación Oficial con Fotografía (INE, Pasaporte o Licencia)</strong> original.</li>
              <li>Calzado cerrado (en áreas de producción o mantenimiento es obligatorio <strong>calzado de seguridad / bota industrial</strong>).</li>
              <li>Portar en todo momento el gafete de visitante que le entregarán en la caseta.</li>
            </ul>
          </div>
          
          ${standardFooter}
        </div>
      `;

      hostBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #047857; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">✅ Confirmación de Visita Autorizada</h2>
          </div>
          <p style="font-size: 14px; color: #334155;">
            Ha autorizado exitosamente el acceso para <strong>${visitor.fullName}</strong> (${visitor.company}) para el día <strong>${dateStr}</strong>.
          </p>
          <p style="font-size: 13px; color: #64748b;">
            El visitante ya recibió su Pase Digital con Código QR. La Caseta de Vigilancia cuenta con la autorización en su sistema para darle paso al llegar.
          </p>
          ${standardFooter}
        </div>
      `;
      break;

    case 'RECHAZO':
      subject = `[No-Reply] ❌ Solicitud de Cita No Autorizada - Folio ${visitor.qrFolio}`;
      visitorBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fda4af; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #be123c; color: #ffffff; padding: 18px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">Solicitud de Cita No Autorizada</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #fecdd3;">${companyTitle}</p>
          </div>
          
          <p style="font-size: 15px; color: #1e293b;">Estimado(a) <strong>${visitor.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Le informamos que su solicitud de visita programada para el día <strong>${dateStr}</strong> con <strong>${visitor.hostName}</strong> no ha podido ser autorizada en esta ocasión.
          </p>
          
          <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 14px; margin: 18px 0; border-radius: 4px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #9f1239; text-transform: uppercase;">MOTIVO INFORMADO POR EL ANFITRIÓN:</p>
            <p style="margin: 0; font-size: 13px; color: #881337; font-style: italic;">"${extraMessage || visitor.rejectionReason || "Cita no confirmada por anfitrión"}"</p>
          </div>
          
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Si requiere reprogramar su cita o aclarar alguna duda, por favor comuníquese directamente con su contacto anfitrión.
          </p>
          ${standardFooter}
        </div>
      `;

      hostBodyHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
          <p style="font-size: 14px; color: #334155;">Ha rechazado la solicitud de <strong>${visitor.fullName}</strong> (${visitor.company}). Se notificó al visitante vía correo automático No-Reply.</p>
          ${standardFooter}
        </div>
      `;
      break;

    case 'CANCELACION':
      subject = `[No-Reply] Cita Cancelada - Folio ${visitor.qrFolio}`;
      visitorBodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
          <div style="background: #475569; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">Cita Cancelada</h2>
          </div>
          <p style="font-size: 15px; color: #334155;">Estimado(a) <strong>${visitor.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">La cita previamente agendada para ${dateStr} con ${visitor.hostName} ha sido cancelada.</p>
          <p style="font-size: 13px; color: #64748b;"><strong>Motivo:</strong> ${extraMessage || visitor.cancellationReason || "Cancelada por anfitrión/administrador"}</p>
          ${standardFooter}
        </div>
      `;

      hostBodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
          <p style="font-size: 14px; color: #334155;">La cita con <strong>${visitor.fullName}</strong> ha sido cancelada.</p>
          ${standardFooter}
        </div>
      `;
      break;
  }

  // Send real email notifications via Gmail API & log to Firestore safely
  try {
    const gmailUser = getGmailUser();
    const activeFromSender = gmailUser?.email
      ? `${configuredSenderName} <${gmailUser.email}>`
      : `${configuredSenderName} <${configuredEmail}>`;

    // Helper for timeout to prevent hanging API calls (12 seconds limit)
    const withTimeout = <T>(promise: Promise<T>, ms = 12000): Promise<T | null> => {
      return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
      ]);
    };

    // Specific subject for Host depending on event type for immediate clarity
    let hostSubject = subject;
    if (eventType === 'SOLICITUD') {
      hostSubject = `[Acción Requerida] 🔔 Nueva Solicitud de Cita por Autorizar: ${visitor.fullName} (${visitor.company})`;
    } else if (eventType === 'EXPRESS_CHECKIN') {
      hostSubject = `[Aviso de Llegada] 🏢 Su visitante ${visitor.fullName} (${visitor.company}) ha ingresado a Planta`;
    } else if (eventType === 'APROBACION') {
      hostSubject = `[Confirmación] ✅ Cita Autorizada para ${visitor.fullName} (${visitor.company})`;
    }

    console.log(`[Notification] Dispatching emails for event ${eventType}: visitor=${visitor.email || 'none'}, host=${visitor.hostEmail || 'none'}`);

    // Execute visitor and host email sending concurrently in parallel
    const sendTasks: Promise<void>[] = [];

    // 1. Task for Visitor email
    if (visitor.email && visitor.email.trim()) {
      sendTasks.push((async () => {
        const recipientEmail = visitor.email!.trim().toLowerCase();
        let visitorSendResult: { success: boolean; messageId?: string; error?: string } | null = { success: false };

        try {
          if (appConfig.appsScriptWebhookUrl) {
            visitorSendResult = await withTimeout(
              sendEmailViaAppsScriptWebhook(
                appConfig.appsScriptWebhookUrl,
                recipientEmail,
                subject,
                visitorBodyHtml,
                configuredSenderName
              ),
              12000
            );
          } else if (getGmailAccessToken()) {
            visitorSendResult = await withTimeout(
              sendEmailViaGmailApi(recipientEmail, subject, visitorBodyHtml, {
                senderDisplayName: configuredSenderName,
                replyToEmail: configuredEmail,
                fromEmail: configuredEmail
              }),
              12000
            );
          }
        } catch (vErr) {
          console.error("Error sending email to visitor:", vErr);
        }

        const vLogRef = doc(collection(db, "email_notifications"));
        const visitorLog: EmailNotificationLog = {
          id: vLogRef.id,
          timestamp,
          from: activeFromSender,
          to: recipientEmail,
          subject,
          bodyHtml: visitorBodyHtml,
          eventType,
          status: (visitorSendResult && visitorSendResult.success)
            ? "SENT"
            : (getGmailAccessToken() || appConfig.appsScriptWebhookUrl ? "FAILED" : "PENDING_GMAIL_AUTH"),
          visitorId: visitor.id,
          visitorName: visitor.fullName,
          qrFolio: visitor.qrFolio
        };

        try {
          await setDoc(vLogRef, sanitizeForFirestore(visitorLog));
        } catch (logErr) {
          console.warn("Could not save email log for visitor:", logErr);
        }
      })());
    }

    // 2. Task for Host email
    if (visitor.hostEmail && visitor.hostEmail.trim()) {
      sendTasks.push((async () => {
        const recipientHostEmail = visitor.hostEmail!.trim().toLowerCase();
        let hostSendResult: { success: boolean; messageId?: string; error?: string } | null = { success: false };

        try {
          if (appConfig.appsScriptWebhookUrl) {
            hostSendResult = await withTimeout(
              sendEmailViaAppsScriptWebhook(
                appConfig.appsScriptWebhookUrl,
                recipientHostEmail,
                hostSubject,
                hostBodyHtml,
                configuredSenderName
              ),
              12000
            );
          } else if (getGmailAccessToken()) {
            hostSendResult = await withTimeout(
              sendEmailViaGmailApi(recipientHostEmail, hostSubject, hostBodyHtml, {
                senderDisplayName: configuredSenderName,
                replyToEmail: configuredEmail,
                fromEmail: configuredEmail
              }),
              12000
            );
          }
        } catch (hErr) {
          console.error("Error sending email to host:", hErr);
        }

        const hLogRef = doc(collection(db, "email_notifications"));
        const hostLog: EmailNotificationLog = {
          id: hLogRef.id,
          timestamp,
          from: activeFromSender,
          to: recipientHostEmail,
          subject: hostSubject,
          bodyHtml: hostBodyHtml,
          eventType,
          status: (hostSendResult && hostSendResult.success)
            ? "SENT"
            : (getGmailAccessToken() || appConfig.appsScriptWebhookUrl ? "FAILED" : "PENDING_GMAIL_AUTH"),
          visitorId: visitor.id,
          visitorName: visitor.fullName,
          qrFolio: visitor.qrFolio
        };

        try {
          await setDoc(hLogRef, sanitizeForFirestore(hostLog));
        } catch (logErr) {
          console.warn("Could not save email log for host:", logErr);
        }
      })());
    }

    // Await both tasks in parallel
    await Promise.allSettled(sendTasks);

    // 3. Create document in 'triggers' collection for email service watcher
    try {
      await addEmailTrigger({
        type: eventType,
        visitor,
        extraMessage
      });
    } catch (trigErr) {
      console.warn("Could not save automated trigger to 'triggers' collection:", trigErr);
    }
  } catch (err) {
    console.error("Error writing email notification log or sending via Gmail API:", err);
  }
}
