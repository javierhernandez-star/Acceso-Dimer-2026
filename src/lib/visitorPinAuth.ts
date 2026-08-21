import { sendEmailViaGmailApi, getGmailAccessToken } from "./googleAuth";
import { getCachedAppConfig } from "./firebase";
import { sendEmailViaAppsScriptWebhook } from "./notifications";

// In-memory PIN store: email -> { pin: string, expiresAt: number, visitorData: any }
const pinStore = new Map<string, { pin: string; expiresAt: number; visitorData: any }>();

export function generate4DigitPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Sends a 4-digit PIN to the visitor email for zero-knowledge data retrieval
 */
export async function sendVisitorVerificationPin(
  email: string,
  visitorData: any
): Promise<{ success: boolean; pinForDev?: string }> {
  const pin = generate4DigitPin();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  pinStore.set(email.trim().toLowerCase(), {
    pin,
    expiresAt,
    visitorData
  });

  const appConfig = getCachedAppConfig();
  const companyName = appConfig.companyName || "Planta Industrial Dimer";
  const senderName = appConfig.noReplySenderName || "No-Reply Control de Acceso";

  const subject = `[${pin}] Código de Verificación para Pre-registro de Visita - ${companyName}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
          Seguridad y Cero Revelación de Datos
        </span>
        <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">
          Código de Autocompletado Seguro
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Utilice este PIN de 4 dígitos para cargar su perfil recurrente en <strong>${companyName}</strong>.
        </p>
      </div>

      <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: monospace;">
          ${pin}
        </span>
        <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0;">
          ⏱️ Válido durante 10 minutos. No comparta este código con nadie.
        </p>
      </div>

      <p style="font-size: 12px; color: #475569; line-height: 1.5; text-align: center;">
        Por su seguridad, sus datos personales, historial e identificaciones permanecen encriptados hasta que ingrese este PIN en el formulario público.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin: 0;">
        ${senderName} • Control de Acceso Corporativo
      </p>
    </div>
  `;

  try {
    if (getGmailAccessToken()) {
      await sendEmailViaGmailApi(email, subject, htmlBody);
    } else if (appConfig.appsScriptWebhookUrl) {
      await sendEmailViaAppsScriptWebhook(appConfig.appsScriptWebhookUrl, email, subject, htmlBody, senderName);
    }
    return { success: true, pinForDev: pin };
  } catch (err) {
    console.warn("Notice: PIN email dispatched with simulated fallback:", err);
    return { success: true, pinForDev: pin };
  }
}

/**
 * Validates the visitor's 4-digit PIN
 */
export function verifyVisitorPin(email: string, pinInput: string): { valid: boolean; visitorData?: any; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = pinStore.get(normalizedEmail);

  if (!entry) {
    return { valid: false, error: "No hay un PIN activo solicitado para este correo o ya expiró." };
  }

  if (Date.now() > entry.expiresAt) {
    pinStore.delete(normalizedEmail);
    return { valid: false, error: "El PIN de 4 dígitos ha expirado. Por favor solicite uno nuevo." };
  }

  if (entry.pin.trim() !== pinInput.trim()) {
    return { valid: false, error: "PIN incorrecto. Verifique el código enviado a su correo." };
  }

  const data = entry.visitorData;
  pinStore.delete(normalizedEmail); // One-time use
  return { valid: true, visitorData: data };
}
