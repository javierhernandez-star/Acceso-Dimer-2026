import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from "firebase/auth";
import firebaseConfigJson from "../../firebase-applet-config.json";
import { initializeApp, getApps, getApp } from "firebase/app";

let app = getApps().length ? getApp() : initializeApp(firebaseConfigJson);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.compose");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.setCustomParameters({
  prompt: "select_account"
});

let cachedAccessToken: string | null = 
  sessionStorage.getItem("gmail_access_token") || localStorage.getItem("gmail_access_token");
let cachedUser: User | null = null;
let listeners: Array<(user: User | null, token: string | null) => void> = [];

export function subscribeGmailAuth(callback: (user: User | null, token: string | null) => void) {
  listeners.push(callback);
  callback(cachedUser, getGmailAccessToken());
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners() {
  const token = getGmailAccessToken();
  listeners.forEach((cb) => cb(cachedUser, token));
}

// Initialize state listener
onAuthStateChanged(auth, (user) => {
  cachedUser = user;
  if (!user) {
    // Only clear if auth signed out explicitly
  }
  notifyListeners();
});

export async function connectGmailAccount(forceSelectAccount = true): Promise<{ user: User; accessToken: string }> {
  try {
    if (forceSelectAccount) {
      provider.setCustomParameters({
        prompt: "select_account login"
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No se obtuvo el Token de Acceso de Gmail desde Google.");
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem("gmail_access_token", cachedAccessToken);
    localStorage.setItem("gmail_access_token", cachedAccessToken);
    if (result.user.email) {
      localStorage.setItem("gmail_connected_email", result.user.email);
    }
    cachedUser = result.user;
    notifyListeners();

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === "auth/popup-closed-by-user") {
      const friendlyErr = new Error("La ventana de inicio de sesión de Google fue cerrada antes de completar la autorización. Puede intentarlo de nuevo en cualquier momento.");
      (friendlyErr as any).code = "auth/popup-closed-by-user";
      throw friendlyErr;
    }
    if (error?.code === "auth/popup-blocked") {
      const friendlyErr = new Error("El navegador bloqueó la ventana emergente de Google. Por favor habilite las ventanas emergentes (popups) en la barra de su navegador e intente nuevamente.");
      (friendlyErr as any).code = "auth/popup-blocked";
      throw friendlyErr;
    }
    if (error?.code === "auth/cancelled-popup-request") {
      const friendlyErr = new Error("Se canceló la solicitud de autenticación.");
      (friendlyErr as any).code = "auth/cancelled-popup-request";
      throw friendlyErr;
    }
    console.error("Error al conectar cuenta de Google Gmail:", error);
    throw error;
  }
}

export function getGmailAccessToken(): string | null {
  return cachedAccessToken || sessionStorage.getItem("gmail_access_token") || localStorage.getItem("gmail_access_token");
}

export function getGmailUser(): User | null {
  return cachedUser;
}

export function getConnectedEmail(): string | null {
  return cachedUser?.email || localStorage.getItem("gmail_connected_email") || null;
}

export async function disconnectGmailAccount() {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
  sessionStorage.removeItem("gmail_access_token");
  localStorage.removeItem("gmail_access_token");
  localStorage.removeItem("gmail_connected_email");
  notifyListeners();
}

/**
 * Encodes string to Base64URL required by Gmail API raw message format
 */
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends real email via Gmail REST API (https://gmail.googleapis.com/gmail/v1/users/me/messages/send)
 */
export async function sendEmailViaGmailApi(
  to: string,
  subject: string,
  bodyHtml: string,
  options?: { senderDisplayName?: string; replyToEmail?: string; fromEmail?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = getGmailAccessToken();
  if (!token) {
    return {
      success: false,
      error: "No hay ninguna cuenta de Google No-Reply conectada con permiso de envío de correos. Conecte su cuenta de Google en el Panel de Administrador."
    };
  }

  try {
    const fromEmail = options?.fromEmail || "noreply@dimer.com.mx";
    const displayName = options?.senderDisplayName || "No-Reply Control de Acceso";
    const encodedDisplayName = `=?utf-8?B?${btoa(unescape(encodeURIComponent(displayName)))}?= <${fromEmail}>`;
    const replyTo = options?.replyToEmail || fromEmail;

    const rawMessage = [
      `To: ${to}`,
      `From: ${encodedDisplayName}`,
      `Reply-To: ${replyTo}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyHtml
    ].join('\r\n');

    const encodedRaw = base64UrlEncode(rawMessage);

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedRaw })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Error al enviar correo vía Gmail API:", response.status, errData);
      
      // If 401 token expired, clear token so user can reconnect
      if (response.status === 401) {
        cachedAccessToken = null;
        sessionStorage.removeItem("gmail_access_token");
        localStorage.removeItem("gmail_access_token");
        notifyListeners();
      }

      return {
        success: false,
        error: errData.error?.message || `Error de servidor Google API (${response.status})`
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error("Excepción enviando correo por Gmail API:", err);
    return { success: false, error: err.message || "Error desconocido en envío por Gmail API" };
  }
}
