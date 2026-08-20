import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Firestore,
  Unsubscribe
} from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";
import {
  Visitor,
  VisitorProfile,
  Host,
  AuditLog,
  AppConfig,
  EmailNotificationLog,
  Employee,
  NotificationTrigger,
  NotificationTriggerRecipient
} from "../types";

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const databaseId = (firebaseConfigJson as Record<string, string>).firestoreDatabaseId || "(default)";

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db: Firestore = databaseId && databaseId !== "(default)"
  ? getFirestore(app, databaseId)
  : getFirestore(app);

// Default seed hosts / employees if empty
export const DEFAULT_HOSTS: Employee[] = [
  {
    id: "emp-1",
    fullName: "Julián Javier Hernández",
    email: "javier.hernandez@dimer.com.mx",
    phone: "+52 55 1234 5678",
    department: "Gerencia General / Operaciones",
    position: "Director de Planta",
    role: "ADMIN",
    status: "ACTIVE",
    pin: "1990",
    passwordPin: "1990"
  },
  {
    id: "emp-2",
    fullName: "Cap. Miguel Ángel Ramos",
    email: "guardia.caseta1@planta.com",
    phone: "+52 55 9012 3456",
    department: "Caseta de Seguridad Norte",
    position: "Guardia Principal (Caseta 1)",
    role: "GUARD",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-3",
    fullName: "Of. Ricardo Ortiz Viveros",
    email: "guardia.caseta2@planta.com",
    phone: "+52 55 8901 2345",
    department: "Caseta de Seguridad Vehicular",
    position: "Guardia Inspección de Andenes",
    role: "GUARD",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-4",
    fullName: "Lic. María Fernanda López",
    email: "m.lopez@empresa.com",
    phone: "+52 55 9876 5432",
    department: "Recursos Humanos",
    position: "Coordinadora de Visitas y Personal",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-5",
    fullName: "Ing. Carlos Eduardo Ramírez",
    email: "c.ramirez@empresa.com",
    phone: "+52 55 4567 8901",
    department: "Seguridad Industrial e Higiene",
    position: "Jefe de Prevención y Riesgos",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-6",
    fullName: "Lic. Ana Patricia Torres",
    email: "a.torres@empresa.com",
    phone: "+52 55 2345 6789",
    department: "Compras y Almacén",
    position: "Supervisora de Recepción de Proveedores",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-7",
    fullName: "Ing. Roberto Gómez Solares",
    email: "r.gomez@empresa.com",
    phone: "+52 55 8765 4321",
    department: "Mantenimiento e Infraestructura",
    position: "Jefe de Mantenimiento de Planta",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-8",
    fullName: "Ing. Valery Sánchez Morales",
    email: "v.sanchez@empresa.com",
    phone: "+52 55 3456 7890",
    department: "Control de Calidad",
    position: "Líder de Aseguramiento de Calidad",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-9",
    fullName: "Lic. Leonardo Morales Nava",
    email: "l.morales@empresa.com",
    phone: "+52 55 6543 2109",
    department: "Tecnologías de la Información",
    position: "Coordinador de Infraestructura TI",
    role: "HOST",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  },
  {
    id: "emp-10",
    fullName: "C.P. Diana Castillo Rangel",
    email: "d.castillo@empresa.com",
    phone: "+52 55 7890 1234",
    department: "Finanzas y Auditoría",
    position: "Auditora Interna de Cumplimiento",
    role: "ADMIN",
    status: "ACTIVE",
    pin: "1234",
    passwordPin: "1234"
  }
];

export const DEFAULT_VISITORS: Visitor[] = [
  {
    id: "vis-demo-1",
    fullName: "Ing. Fernando Castro Álvarez",
    company: "Ingeniería y Mantenimiento Industrial S.A.",
    email: "f.castro@mantenimiento.com",
    phone: "+52 55 3344 5566",
    idType: "INE",
    idNumber: "INE9876543210",
    accessType: "Contratista",
    hostId: "emp-1",
    hostName: "Julián Javier Hernández",
    hostEmail: "javier.hernandez@dimer.com.mx",
    department: "Gerencia General / Operaciones",
    zone: "Nave A - Mantenimiento Planta",
    scheduledDateTime: new Date(Date.now() + 3600000).toISOString(),
    healthDeclaration: true,
    status: "PENDING",
    qrFolio: "QR-CON-884920",
    vehiclePlates: "NXX-892-A",
    equipmentRegistered: "Laptop Dell Precision, Multímetro Fluke 87V, Maletín de Herramientas Dieléctricas",
    companionCount: 2,
    companions: [
      { id: "comp-1", fullName: "Téc. Juan Pedro Méndez", idNumber: "INE1122334455", company: "Ingeniería Industrial S.A." },
      { id: "comp-2", fullName: "Téc. Mario Alberto Silva", idNumber: "INE6677889900", company: "Ingeniería Industrial S.A." }
    ],
    contractorDetails: {
      workOrderPo: "OT-2026-9041",
      imssInsuranceNum: "12984710928",
      hasEpp: true,
      highRiskPermit: true,
      highRiskType: "Trabajos en Altura y Eléctricos de Media Tensión"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "vis-demo-2",
    fullName: "Lic. Sofía Mendoza Reyes",
    company: "DHL Express México / Proveedor Logístico",
    email: "sofia.mendoza@dhl.com",
    phone: "+52 55 6677 8899",
    idType: "INE",
    idNumber: "INE5544332211",
    accessType: "Proveedor",
    hostId: "emp-6",
    hostName: "Lic. Ana Patricia Torres",
    hostEmail: "a.torres@empresa.com",
    department: "Compras y Almacén",
    zone: "Almacén General y Andenes",
    scheduledDateTime: new Date().toISOString(),
    healthDeclaration: true,
    status: "APPROVED",
    qrFolio: "QR-PRO-331092",
    badgeNumber: "G-PRO-102",
    vehiclePlates: "LE-991-02",
    companionCount: 1,
    companions: [
      { id: "comp-3", fullName: "Chofer Ernesto Guajardo", idNumber: "LIC-TR-90182", company: "DHL Transportes" }
    ],
    supplierDetails: {
      invoiceOrWaybill: "FACT-DHL-881029",
      cargoType: "Entrega de Materia Prima y Repuestos",
      trailerPlates: "TR-881-MX",
      materialsDescription: "3 Pallets con insumos de empaque de alta densidad"
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "vis-demo-3",
    fullName: "Lic. Alejandro Ruiz Salgado",
    company: "Consultoría en Talento Humano",
    email: "a.ruiz@talentohumano.com",
    phone: "+52 55 1122 3344",
    idType: "Licencia",
    idNumber: "LIC-8840192",
    accessType: "Entrevista",
    hostId: "emp-4",
    hostName: "Lic. María Fernanda López",
    hostEmail: "m.lopez@empresa.com",
    department: "Recursos Humanos",
    zone: "Oficinas Administrativas",
    scheduledDateTime: new Date().toISOString(),
    healthDeclaration: true,
    status: "CHECKED_IN",
    qrFolio: "QR-ENT-901823",
    badgeNumber: "G-ENT-101",
    checkInTime: new Date(Date.now() - 1800000).toISOString(),
    interviewDetails: {
      jobPositionApplied: "Gerente de Control de Calidad",
      recruiterName: "Lic. María Fernanda López",
      vacancyFolio: "VAC-2026-04"
    },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "vis-demo-4",
    fullName: "Arq. Gabriel Domínguez Peña",
    company: "Constructora e Infraestructura del Norte",
    email: "g.dominguez@constructora.com",
    phone: "+52 55 4455 6677",
    idType: "INE",
    idNumber: "INE4433221100",
    accessType: "Contratista",
    hostId: "emp-7",
    hostName: "Ing. Roberto Gómez Solares",
    hostEmail: "r.gomez@empresa.com",
    department: "Mantenimiento e Infraestructura",
    zone: "Nave B - Ampliación Subestación",
    scheduledDateTime: new Date(Date.now() + 7200000).toISOString(),
    healthDeclaration: true,
    status: "APPROVED",
    qrFolio: "QR-CON-771029",
    vehiclePlates: "JXX-441-C",
    equipmentRegistered: "Estación Total Topográfica Leica, Cortadora de Concreto, Cascos con Barbiquejo",
    companionCount: 3,
    companions: [
      { id: "comp-4", fullName: "Ing. Esteban Pineda", idNumber: "CED-771920", company: "Constructora del Norte" },
      { id: "comp-5", fullName: "C. Martín Estrada", idNumber: "INE8829102", company: "Constructora del Norte" },
      { id: "comp-6", fullName: "C. Javier Reséndiz", idNumber: "INE9910293", company: "Constructora del Norte" }
    ],
    contractorDetails: {
      workOrderPo: "OT-2026-8801",
      imssInsuranceNum: "99182736451",
      hasEpp: true,
      highRiskPermit: true,
      highRiskType: "Trabajos de Excavación y Obra Civil"
    },
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "vis-demo-5",
    fullName: "Ing. Patricia Vega Rincón",
    company: "Asesoría Ambiental y Ecológica",
    email: "p.vega@asesoriamx.com",
    phone: "+52 55 7788 9900",
    idType: "INE",
    idNumber: "INE3322114455",
    accessType: "Visita General",
    hostId: "emp-5",
    hostName: "Ing. Carlos Eduardo Ramírez",
    hostEmail: "c.ramirez@empresa.com",
    department: "Seguridad Industrial e Higiene",
    zone: "Planta de Tratamiento de Aguas",
    scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
    healthDeclaration: true,
    status: "PENDING",
    qrFolio: "QR-GEN-554102",
    generalDetails: {
      visitReason: "Auditoría Ambiental y Muestreo de Descargas Residuales",
      companionCount: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "vis-demo-6",
    fullName: "Tec. Marco Antonio Solís",
    company: "Robótica y Automatización Industrial",
    email: "marco.solis@robotica.com",
    phone: "+52 55 8899 0011",
    idType: "INE",
    idNumber: "INE1231231234",
    accessType: "Contratista",
    hostId: "emp-7",
    hostName: "Ing. Roberto Gómez Solares",
    hostEmail: "r.gomez@empresa.com",
    department: "Mantenimiento e Infraestructura",
    zone: "Línea de Ensamble 2",
    scheduledDateTime: new Date(Date.now() - 86400000).toISOString(),
    healthDeclaration: true,
    status: "CHECKED_OUT",
    qrFolio: "QR-MAN-112094",
    badgeNumber: "G-CON-304",
    checkInTime: new Date(Date.now() - 28800000).toISOString(),
    checkOutTime: new Date(Date.now() - 14400000).toISOString(),
    contractorDetails: {
      workOrderPo: "PO-77401",
      imssInsuranceNum: "33019284756",
      hasEpp: true,
      highRiskPermit: false
    },
    createdAt: new Date(Date.now() - 90000000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "vis-demo-7",
    fullName: "Dra. Laura Elena Chapa",
    company: "Bureau Veritas Auditorías ISO",
    email: "laura.chapa@bureauveritas.com",
    phone: "+52 55 2233 4455",
    idType: "Pasaporte",
    idNumber: "PAS-901827",
    accessType: "Visita General",
    hostId: "emp-8",
    hostName: "Ing. Valery Sánchez Morales",
    hostEmail: "v.sanchez@empresa.com",
    department: "Control de Calidad",
    zone: "Laboratorio de Ensayos y Sala de Juntas",
    scheduledDateTime: new Date(Date.now() + 172800000).toISOString(),
    healthDeclaration: true,
    status: "APPROVED",
    qrFolio: "QR-AUD-449012",
    generalDetails: {
      visitReason: "Auditoría Externa de Recertificación ISO 9001:2015",
      companionCount: 1,
      companions: [
        { id: "comp-7", fullName: "Ing. Roberto Treviño", idNumber: "INE441029", company: "Bureau Veritas" }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "vis-demo-8",
    fullName: "Sr. Rodrigo Navarrete Pineda",
    company: "Transportes Refrigerados del Centro",
    email: "r.navarrete@refrigerados.com",
    phone: "+52 55 5566 7788",
    idType: "Licencia",
    idNumber: "LIC-771029",
    accessType: "Proveedor",
    hostId: "emp-6",
    hostName: "Lic. Ana Patricia Torres",
    hostEmail: "a.torres@empresa.com",
    department: "Compras y Almacén",
    zone: "Andén 4",
    scheduledDateTime: new Date(Date.now() - 3600000).toISOString(),
    healthDeclaration: false,
    healthNotes: "No presentó equipo de protección personal ni manifiesto de carga firmado",
    status: "REJECTED",
    rejectionReason: "Incumplimiento de Protocolo de EPP Obligatorio en Andenes de Carga y Faltante de Manifiesto",
    qrFolio: "QR-PRO-908123",
    supplierDetails: {
      invoiceOrWaybill: "SIN-DOCUMENTO",
      cargoType: "Material Químico Sensible"
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "vis-demo-9",
    fullName: "Lic. Andrea Villanueva Gil",
    company: "Cisco Systems México / Redes y Fibra Optica",
    email: "a.villanueva@cisco.com",
    phone: "+52 55 9900 1122",
    idType: "INE",
    idNumber: "INE8877665544",
    accessType: "Visita General",
    hostId: "emp-9",
    hostName: "Lic. Leonardo Morales Nava",
    hostEmail: "l.morales@empresa.com",
    department: "Tecnologías de la Información",
    zone: "Data Center y Conmutadores",
    scheduledDateTime: new Date().toISOString(),
    healthDeclaration: true,
    status: "CANCELLED",
    cancellationReason: "Reprogramación de Migración de Servidores por Ventana de Mantenimiento Fin de Semana",
    cancellationBy: "Lic. Leonardo Morales Nava (Anfitrión)",
    cancelledAt: new Date().toISOString(),
    qrFolio: "QR-CON-332104",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "vis-demo-10",
    fullName: "Ing. Héctor Manuel Prieto",
    company: "Dirección de Protección Civil y Bomberos",
    email: "h.prieto@proteccioncivil.gob.mx",
    phone: "+52 55 4411 2233",
    idType: "Otro",
    idNumber: "GOB-PC-00921",
    accessType: "Visita General",
    hostId: "emp-5",
    hostName: "Ing. Carlos Eduardo Ramírez",
    hostEmail: "c.ramirez@empresa.com",
    department: "Seguridad Industrial e Higiene",
    zone: "Recorrido General de Planta e Hidrantes",
    scheduledDateTime: new Date().toISOString(),
    healthDeclaration: true,
    status: "CHECKED_IN",
    qrFolio: "QR-INS-665120",
    badgeNumber: "G-VIP-001",
    checkInTime: new Date(Date.now() - 3600000).toISOString(),
    companionCount: 1,
    companions: [
      { id: "comp-8", fullName: "Insp. Raúl Tamayo", idNumber: "GOB-PC-00925", company: "Protección Civil" }
    ],
    generalDetails: {
      visitReason: "Inspección Anual de Sistemas de Supresión de Incendio y Rutas de Evacuación"
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const DEFAULT_CONFIG: AppConfig = {
  guardPin: "1234",
  adminPin: "1990",
  companyName: "Planta Industrial Dimer - Control de Acceso",
  noReplyEmail: "no-reply@dimer.com.mx",
  noReplySenderName: "No-Reply Control de Acceso"
};

// Robust Local Storage Cache Keys
const STORAGE_VISITORS_KEY = "dimer_visitors_v3";
const STORAGE_PROFILES_KEY = "dimer_visitor_profiles_v3";
const STORAGE_HOSTS_KEY = "dimer_hosts_v3";
const STORAGE_AUDIT_KEY = "dimer_audit_logs_v3";
const STORAGE_CONFIG_KEY = "dimer_config_v3";

// In-memory active listeners
const visitorListeners = new Set<(visitors: Visitor[]) => void>();
const profileListeners = new Set<(profiles: VisitorProfile[]) => void>();
const hostListeners = new Set<(hosts: Host[]) => void>();
const auditListeners = new Set<(logs: AuditLog[]) => void>();
const configListeners = new Set<(config: AppConfig) => void>();

// Default Initial Profiles
export const DEFAULT_PROFILES: VisitorProfile[] = [
  {
    id: "prof-1",
    fullName: "Ing. Roberto Carlos Méndez",
    company: "Siemens Energy México",
    email: "r.mendez@siemens.com",
    phone: "+52 55 1234 5678",
    idType: "INE",
    idNumber: "INE1234567890",
    accessType: "Contratista",
    vehiclePlates: "ABC-123-D",
    totalVisits: 1,
    lastVisitDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prof-2",
    fullName: "Lic. Sandra Gómez Morales",
    company: "Transportes y Logística Monterrey",
    email: "s.gomez@transmonterrey.com",
    phone: "+52 81 8765 4321",
    idType: "Licencia",
    idNumber: "LIC-NL-998877",
    accessType: "Proveedor",
    vehiclePlates: "NL-9988-B",
    totalVisits: 1,
    lastVisitDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prof-3",
    fullName: "Ing. Alejandro Morales Vega",
    company: "Schneider Electric México",
    email: "a.morales@se.com",
    phone: "+52 55 5544 3322",
    idType: "INE",
    idNumber: "INE9876543210",
    accessType: "Contratista",
    vehiclePlates: "CDMX-456-F",
    totalVisits: 1,
    lastVisitDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prof-4",
    fullName: "Lic. Valeria Domínguez Soto",
    company: "Candidata Vacante - Ing. de Procesos",
    email: "v.dominguez@gmail.com",
    phone: "+52 55 6677 8899",
    idType: "INE",
    idNumber: "INE5566778899",
    accessType: "Entrevista",
    totalVisits: 1,
    lastVisitDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prof-5",
    fullName: "Ing. Fernando Castro Rivas",
    company: "ABB Power Grids México",
    email: "f.castro@abb.com",
    phone: "+52 55 3322 1100",
    idType: "INE",
    idNumber: "INE1122334455",
    accessType: "Contratista",
    vehiclePlates: "ABB-789-G",
    totalVisits: 1,
    lastVisitDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getLocalProfiles(): VisitorProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse local profiles cache:", e);
  }
  try {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
  } catch (_) {}
  return [...DEFAULT_PROFILES];
}

export function saveLocalProfiles(profiles: VisitorProfile[]): void {
  try {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn("Could not save local profiles cache:", e);
  }
  profileListeners.forEach((fn) => {
    try {
      fn([...profiles]);
    } catch (err) {
      console.warn("Profile listener notice:", err);
    }
  });
}

// Subscribe to Visitor Profiles in Firestore and local storage
export function subscribeVisitorProfiles(onData: (profiles: VisitorProfile[]) => void): Unsubscribe {
  const initialLocal = getLocalProfiles();
  onData(initialLocal);
  profileListeners.add(onData);

  const q = query(collection(db, "visitor_profiles"));
  let unsubscribeFirestore: Unsubscribe | null = null;

  try {
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: VisitorProfile[] = [];
        snapshot.forEach((doc) => {
          firestoreList.push({ id: doc.id, ...doc.data() } as VisitorProfile);
        });

        const currentLocal = getLocalProfiles();
        const map = new Map<string, VisitorProfile>();

        currentLocal.forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });

        firestoreList.forEach((fp) => {
          if (fp && fp.id) map.set(fp.id, fp);
        });

        DEFAULT_PROFILES.forEach((dp) => {
          if (!map.has(dp.id)) {
            map.set(dp.id, dp);
          }
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => (a.fullName || "").localeCompare(b.fullName || "")
        );
        saveLocalProfiles(merged);
      },
      (error) => {
        console.warn("Firestore visitor_profiles subscription warning:", error);
        onData(getLocalProfiles());
      }
    );
  } catch (err) {
    console.warn("Error setting up onSnapshot for visitor_profiles:", err);
  }

  return () => {
    profileListeners.delete(onData);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

export async function addVisitorProfile(profile: Omit<VisitorProfile, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const newRef = doc(collection(db, "visitor_profiles"));
  const now = new Date().toISOString();
  const profileWithId: VisitorProfile = {
    ...profile,
    id: newRef.id,
    totalVisits: profile.totalVisits || 0,
    createdAt: now,
    updatedAt: now
  };

  const currentList = getLocalProfiles();
  const updatedList = [profileWithId, ...currentList.filter(p => p.id !== profileWithId.id)];
  saveLocalProfiles(updatedList);

  setDoc(newRef, sanitizeForFirestore(profileWithId)).catch(() => {});
  return newRef.id;
}

export async function updateVisitorProfile(id: string, updates: Partial<VisitorProfile>): Promise<void> {
  const now = new Date().toISOString();
  const mergedUpdates = { ...updates, updatedAt: now };

  const currentList = getLocalProfiles();
  const updatedList = currentList.map(p => p.id === id ? { ...p, ...mergedUpdates } : p);
  saveLocalProfiles(updatedList);

  updateDoc(doc(db, "visitor_profiles", id), sanitizeForFirestore(mergedUpdates)).catch(() => {});
}

export async function deleteVisitorProfile(id: string, visitorName: string = "Visitante"): Promise<void> {
  const currentList = getLocalProfiles();
  const updatedList = currentList.filter(p => p.id !== id);
  saveLocalProfiles(updatedList);

  deleteDoc(doc(db, "visitor_profiles", id)).catch(() => {});

  addAuditLog(
    "DELETE_VISITOR_PROFILE",
    id,
    visitorName,
    "Administrador",
    `Eliminado expediente del padrón de visitantes: ${visitorName}`,
    { origin: "ADMIN_PORTAL" }
  ).catch(() => {});
}

// Helper to safely read from localStorage
export function getLocalVisitors(): Visitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_VISITORS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse local visitors cache:", e);
  }
  // Initialize with default visitors ONLY on first run if nothing in localStorage
  try {
    localStorage.setItem(STORAGE_VISITORS_KEY, JSON.stringify(DEFAULT_VISITORS));
  } catch (_) {}
  return [...DEFAULT_VISITORS];
}

export function saveLocalVisitors(visitors: Visitor[]): void {
  try {
    localStorage.setItem(STORAGE_VISITORS_KEY, JSON.stringify(visitors));
  } catch (e) {
    console.warn("Could not save local visitors cache:", e);
  }
  // Notify active listeners immediately
  visitorListeners.forEach((fn) => {
    try {
      fn([...visitors]);
    } catch (err) {
      console.warn("Visitor listener notice:", err);
    }
  });
}

export function getLocalHosts(): Host[] {
  try {
    const raw = localStorage.getItem(STORAGE_HOSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse local hosts cache:", e);
  }
  try {
    localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(DEFAULT_HOSTS));
  } catch (_) {}
  return [...DEFAULT_HOSTS];
}

export function saveLocalHosts(hosts: Host[]): void {
  try {
    localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(hosts));
  } catch (e) {
    console.warn("Could not save local hosts cache:", e);
  }
  hostListeners.forEach((fn) => {
    try {
      fn([...hosts]);
    } catch (err) {
      console.warn("Host listener notice:", err);
    }
  });
}

export function getLocalAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse local audit logs cache:", e);
  }
  return [];
}

export function saveLocalAuditLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn("Could not save local audit logs cache:", e);
  }
  auditListeners.forEach((fn) => {
    try {
      fn([...logs]);
    } catch (err) {
      console.warn("Audit listener notice:", err);
    }
  });
}

export function getLocalConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Could not parse local config cache:", e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveLocalConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Could not save local config cache:", e);
  }
  configListeners.forEach((fn) => {
    try {
      fn({ ...config });
    } catch (err) {
      console.warn("Config listener notice:", err);
    }
  });
}

// Seed initial data if empty or missing any default hosts/visitors
export async function seedInitialDataIfEmpty() {
  try {
    // 1. Ensure all default hosts exist in Firestore in background
    for (const host of DEFAULT_HOSTS) {
      const hostRef = doc(db, "hosts", host.id);
      getDoc(hostRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(hostRef, sanitizeForFirestore(host), { merge: true }).catch(() => {});
        }
      }).catch(() => {});
    }

    // 2. Ensure default visitors exist in Firestore in background
    for (const visitor of DEFAULT_VISITORS) {
      const visRef = doc(db, "visitors", visitor.id);
      getDoc(visRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(visRef, sanitizeForFirestore(visitor), { merge: true }).catch(() => {});
        }
      }).catch(() => {});
    }

    // 2.1 Ensure default visitor profiles exist in Firestore in background
    for (const profile of DEFAULT_PROFILES) {
      const profRef = doc(db, "visitor_profiles", profile.id);
      getDoc(profRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(profRef, sanitizeForFirestore(profile), { merge: true }).catch(() => {});
        }
      }).catch(() => {});
    }

    // 3. Ensure config exists
    const configRef = doc(db, "app_config", "settings");
    getDoc(configRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(configRef, sanitizeForFirestore(DEFAULT_CONFIG)).catch(() => {});
      }
    }).catch(() => {});
  } catch (err) {
    console.warn("Notice during seedInitialDataIfEmpty:", err);
  }
}

// Force seed initial demo data
export async function forceSeedInitialData() {
  try {
    saveLocalHosts(DEFAULT_HOSTS);
    saveLocalVisitors(DEFAULT_VISITORS);
    saveLocalProfiles(DEFAULT_PROFILES);
    saveLocalConfig(DEFAULT_CONFIG);

    for (const host of DEFAULT_HOSTS) {
      await setDoc(doc(db, "hosts", host.id), sanitizeForFirestore(host), { merge: true }).catch(() => {});
    }
    for (const visitor of DEFAULT_VISITORS) {
      await setDoc(doc(db, "visitors", visitor.id), sanitizeForFirestore(visitor), { merge: true }).catch(() => {});
    }
    for (const profile of DEFAULT_PROFILES) {
      await setDoc(doc(db, "visitor_profiles", profile.id), sanitizeForFirestore(profile), { merge: true }).catch(() => {});
    }
    await setDoc(doc(db, "app_config", "settings"), sanitizeForFirestore(DEFAULT_CONFIG), { merge: true }).catch(() => {});
    console.log("Force seeded demo hosts and visitors successfully");
  } catch (err) {
    console.error("Error force seeding initial data:", err);
  }
}

// 1. VISITORS REAL-TIME SUBSCRIBER (Dual Persistence with Instant Cache)
export function subscribeVisitors(onData: (visitors: Visitor[]) => void): Unsubscribe {
  // 1. Deliver local cached data immediately (instant UI loading, zero delay)
  const initialLocal = getLocalVisitors();
  onData(initialLocal);
  visitorListeners.add(onData);

  // 2. Setup Firestore real-time listener and merge
  const q = query(collection(db, "visitors"));
  let unsubscribeFirestore: Unsubscribe | null = null;

  try {
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: Visitor[] = [];
        snapshot.forEach((doc) => {
          firestoreList.push({ id: doc.id, ...doc.data() } as Visitor);
        });

        const currentLocal = getLocalVisitors();
        const map = new Map<string, Visitor>();

        // 1. Put current local cache first
        currentLocal.forEach((v) => {
          if (v && v.id) map.set(v.id, v);
        });

        // 2. Merge Firestore items (updates or additions from cloud)
        firestoreList.forEach((fv) => {
          if (fv && fv.id) map.set(fv.id, fv);
        });

        // 3. Ensure DEFAULT_VISITORS are preserved
        DEFAULT_VISITORS.forEach((dv) => {
          if (!map.has(dv.id)) {
            map.set(dv.id, dv);
          }
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        saveLocalVisitors(merged);
      },
      (error) => {
        console.warn("Firestore Visitors subscription warning:", error);
        // On error, deliver full local dataset rather than resetting
        onData(getLocalVisitors());
      }
    );
  } catch (err) {
    console.warn("Error setting up onSnapshot for visitors:", err);
  }

  return () => {
    visitorListeners.delete(onData);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// 2. HOSTS REAL-TIME SUBSCRIBER (Dual Persistence with Instant Cache)
export function subscribeHosts(onData: (hosts: Host[]) => void): Unsubscribe {
  const initialHosts = getLocalHosts();
  onData(initialHosts);
  hostListeners.add(onData);

  const q = query(collection(db, "hosts"));
  let unsubscribeFirestore: Unsubscribe | null = null;

  try {
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const hostsList: Host[] = [];
        snapshot.forEach((doc) => {
          hostsList.push({ id: doc.id, ...doc.data() } as Host);
        });

        const currentLocal = getLocalHosts();
        const map = new Map<string, Host>();

        currentLocal.forEach((h) => {
          if (h && h.id) map.set(h.id, h);
        });

        hostsList.forEach((fh) => {
          if (fh && fh.id) {
            map.set(fh.id, fh);
          }
        });

        DEFAULT_HOSTS.forEach((dh) => {
          if (!map.has(dh.id)) {
            map.set(dh.id, dh);
          }
        });

        const merged = Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
        saveLocalHosts(merged);
      },
      (error) => {
        console.warn("Firestore Hosts subscription warning:", error);
        onData(getLocalHosts());
      }
    );
  } catch (err) {
    console.warn("Error setting up onSnapshot for hosts:", err);
  }

  return () => {
    hostListeners.delete(onData);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// 3. AUDIT LOGS REAL-TIME SUBSCRIBER
export function subscribeAuditLogs(onData: (logs: AuditLog[]) => void): Unsubscribe {
  onData(getLocalAuditLogs());
  auditListeners.add(onData);

  const q = query(collection(db, "audit_logs"));
  let unsubscribeFirestore: Unsubscribe | null = null;

  try {
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const logsList: AuditLog[] = [];
        snapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() } as AuditLog);
        });

        const currentLocal = getLocalAuditLogs();
        const map = new Map<string, AuditLog>();

        currentLocal.forEach((l) => {
          if (l && l.id) map.set(l.id, l);
        });

        logsList.forEach((fl) => {
          if (fl && fl.id) map.set(fl.id, fl);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        saveLocalAuditLogs(merged);
      },
      (error) => {
        console.warn("Firestore AuditLogs subscription warning:", error);
        onData(getLocalAuditLogs());
      }
    );
  } catch (err) {
    console.warn("Error subscribing to audit_logs:", err);
  }

  return () => {
    auditListeners.delete(onData);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// 4. CONFIG REAL-TIME SUBSCRIBER
let cachedAppConfig: AppConfig = getLocalConfig();

export function getCachedAppConfig(): AppConfig {
  return cachedAppConfig;
}

export function subscribeConfig(onData: (config: AppConfig) => void): Unsubscribe {
  onData(getLocalConfig());
  configListeners.add(onData);

  let unsubscribeFirestore: Unsubscribe | null = null;
  try {
    unsubscribeFirestore = onSnapshot(
      doc(db, "app_config", "settings"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppConfig;
          cachedAppConfig = { ...DEFAULT_CONFIG, ...data };
          saveLocalConfig(cachedAppConfig);
        }
      },
      (error) => {
        console.warn("Firestore Config subscription warning:", error);
        onData(getLocalConfig());
      }
    );
  } catch (err) {
    console.warn("Error subscribing to app_config:", err);
  }

  return () => {
    configListeners.delete(onData);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

// Helper to recursively strip undefined properties for Firestore
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// AUTOMATED NOTIFICATION TRIGGERS COLLECTION
/**
 * Creates an automated notification trigger in the `triggers` collection in Firestore.
 * An email service, background worker, or Cloud Function can watch this collection for new citations,
 * pre-registrations, and status updates to send automated notifications to visitors and hosts.
 */
export async function addEmailTrigger(triggerData: {
  type: NotificationTrigger['type'];
  visitor: Visitor;
  extraMessage?: string;
}): Promise<string> {
  try {
    const triggerRef = doc(collection(db, "triggers"));
    const recipients: NotificationTriggerRecipient[] = [];
    if (triggerData.visitor.email) {
      recipients.push({ email: triggerData.visitor.email, role: "VISITOR" });
    }
    if (triggerData.visitor.hostEmail) {
      recipients.push({ email: triggerData.visitor.hostEmail, role: "HOST" });
    }

    const triggerDoc: NotificationTrigger = {
      id: triggerRef.id,
      type: triggerData.type,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      visitorId: triggerData.visitor.id,
      visitorName: triggerData.visitor.fullName || "",
      visitorEmail: triggerData.visitor.email || "",
      hostName: triggerData.visitor.hostName || "",
      hostEmail: triggerData.visitor.hostEmail || "",
      company: triggerData.visitor.company || "",
      accessType: triggerData.visitor.accessType,
      qrFolio: triggerData.visitor.qrFolio,
      badgeNumber: triggerData.visitor.badgeNumber || "",
      scheduledDateTime: triggerData.visitor.scheduledDateTime,
      extraMessage: triggerData.extraMessage || "",
      recipients,
      visitorData: triggerData.visitor
    };

    const sanitized = sanitizeForFirestore(triggerDoc);
    await setDoc(triggerRef, sanitized);
    return triggerRef.id;
  } catch (err) {
    console.error("Error writing automated notification trigger to 'triggers' collection:", err);
    return "";
  }
}

/**
 * Subscribes to the `triggers` collection in Firestore to listen for automated notification events.
 */
export function subscribeToTriggers(callback: (triggers: NotificationTrigger[]) => void): Unsubscribe {
  const q = query(collection(db, "triggers"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: NotificationTrigger[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as NotificationTrigger);
      });
      callback(list);
    },
    (error) => {
      console.error("Error subscribing to triggers collection:", error);
    }
  );
}

// MUTATION HELPERS
export async function addVisitor(visitor: Omit<Visitor, "id">): Promise<string> {
  const newRef = doc(collection(db, "visitors"));
  const visitorWithId: Visitor = {
    ...visitor,
    id: newRef.id,
    createdAt: visitor.createdAt || new Date().toISOString(),
    updatedAt: visitor.updatedAt || new Date().toISOString()
  };

  // 1. Immediately persist locally and broadcast to UI components (instant UI response)
  const currentList = getLocalVisitors();
  const updatedList = [visitorWithId, ...currentList.filter(v => v.id !== visitorWithId.id)];
  saveLocalVisitors(updatedList);

  // 1.1 Also ensure the visitor exists in the independent Visitor Profiles Directory
  try {
    const currentProfiles = getLocalProfiles();
    const existingProfile = currentProfiles.find(
      p => (p.idNumber && visitor.idNumber && p.idNumber === visitor.idNumber && p.idNumber !== "S/N") ||
           (p.email && visitor.email && p.email.toLowerCase() === visitor.email.toLowerCase()) ||
           p.fullName.toLowerCase() === visitor.fullName.toLowerCase()
    );

    if (existingProfile) {
      updateVisitorProfile(existingProfile.id, {
        totalVisits: (existingProfile.totalVisits || 0) + 1,
        lastVisitDate: visitor.scheduledDateTime || new Date().toISOString(),
        company: visitor.company || existingProfile.company,
        phone: visitor.phone || existingProfile.phone,
        vehiclePlates: visitor.vehiclePlates || existingProfile.vehiclePlates
      }).catch(() => {});
    } else {
      addVisitorProfile({
        fullName: visitor.fullName,
        company: visitor.company,
        email: visitor.email,
        phone: visitor.phone,
        idType: visitor.idType || "INE",
        idNumber: visitor.idNumber || "S/N",
        accessType: visitor.accessType,
        vehiclePlates: visitor.vehiclePlates,
        totalVisits: 1,
        lastVisitDate: visitor.scheduledDateTime || new Date().toISOString()
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Could not sync profile directory:", err);
  }

  // 2. Synchronize to Firestore in background (non-blocking)
  const sanitized = sanitizeForFirestore(visitorWithId);
  setDoc(newRef, sanitized).catch((err) => {
    console.warn("Firestore addVisitor background write warning:", err);
  });

  // 3. Automatically insert record into 'triggers' collection for email service watcher
  try {
    const triggerType: NotificationTrigger['type'] = visitor.isExpress
      ? "EXPRESS_CHECKIN"
      : (visitor.status === "PENDING" ? "PRE_REGISTRATION" : "NEW_CITATION");
    addEmailTrigger({
      type: triggerType,
      visitor: visitorWithId
    }).catch(() => {});
  } catch (trigErr) {
    console.warn("Notice: notification trigger generation deferred:", trigErr);
  }

  // 4. Detailed Audit Log in background with all visitor and host metadata
  const isExpress = !!visitor.isExpress;
  const origin = isExpress ? "CASETA" : "WEB_PREREGISTER";
  const performedBy = isExpress ? "Guardia de Seguridad (Caseta)" : `${visitor.fullName} (Pre-Registro Web)`;
  const actionName: AuditLog["action"] = isExpress ? "EXPRESS_REGISTER" : "PRE_REGISTER";

  const companionsSummary = visitor.companions && visitor.companions.length > 0
    ? visitor.companions.map(c => `${c.fullName}${c.badgeNumber ? ` (Gafete: ${c.badgeNumber})` : ''}`).join(", ")
    : undefined;

  const logDetails = isExpress
    ? `Registro Exprés en Caseta para ${visitor.fullName} (${visitor.company} - ${visitor.accessType}). Anfitrión: ${visitor.hostName} (${visitor.department}). Gafete: ${visitor.badgeNumber || 'Pendiente'}. Folio QR: ${visitor.qrFolio}.`
    : `Pre-registro de cita vía Portal Web por ${visitor.fullName} (${visitor.company} - ${visitor.accessType}). Solicitud para visitar a: ${visitor.hostName} (${visitor.department}). Folio QR: ${visitor.qrFolio}. Estado: ${visitor.status}.`;

  addAuditLog(
    actionName,
    newRef.id,
    visitor.fullName,
    performedBy,
    logDetails,
    {
      origin,
      company: visitor.company,
      accessType: visitor.accessType,
      qrFolio: visitor.qrFolio,
      badgeNumber: visitor.badgeNumber,
      hostId: visitor.hostId,
      hostName: visitor.hostName,
      hostEmail: visitor.hostEmail,
      hostDepartment: visitor.department,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone,
      idType: visitor.idType,
      idNumber: visitor.idNumber,
      vehiclePlates: visitor.vehiclePlates,
      scheduledDateTime: visitor.scheduledDateTime,
      checkInTime: visitor.checkInTime,
      checkOutTime: visitor.checkOutTime,
      companionsCount: visitor.companionCount || (visitor.companions?.length || 0),
      companionsSummary
    }
  ).catch(() => {});

  return newRef.id;
}

export async function updateVisitorStatus(
  id: string,
  updates: Partial<Visitor>,
  performedBy: string,
  actionName: AuditLog["action"],
  logDetails: string
): Promise<void> {
  const now = new Date().toISOString();
  const mergedUpdates = { ...updates, updatedAt: now };

  // 1. Immediately update locally
  const currentList = getLocalVisitors();
  let existingVisitor: Visitor | undefined;
  const updatedList = currentList.map((v) => {
    if (v.id === id) {
      existingVisitor = v;
      return { ...v, ...mergedUpdates };
    }
    return v;
  });
  saveLocalVisitors(updatedList);

  const fullVisitorSnapshot: Partial<Visitor> = existingVisitor
    ? { ...existingVisitor, ...mergedUpdates }
    : { ...mergedUpdates };

  // 2. Sync to Firestore in background
  const ref = doc(db, "visitors", id);
  const sanitized = sanitizeForFirestore(mergedUpdates);
  updateDoc(ref, sanitized).catch((err) => {
    console.warn("Firestore updateVisitorStatus background write warning:", err);
  });

  // Determine origin
  let origin = "CASETA";
  if (actionName === "APPROVE" || actionName === "REJECT" || actionName === "CANCEL") {
    origin = performedBy.toLowerCase().includes("admin") ? "ADMIN_PORTAL" : "HOST_PORTAL";
  } else if (actionName === "CHECK_IN" || actionName === "CHECK_OUT") {
    origin = "CASETA";
  } else if (performedBy.toLowerCase().includes("admin")) {
    origin = "ADMIN_PORTAL";
  }

  // Calculate duration if check-out
  let durationMinutes: number | undefined;
  if (fullVisitorSnapshot.checkInTime && fullVisitorSnapshot.checkOutTime) {
    const diffMs = new Date(fullVisitorSnapshot.checkOutTime).getTime() - new Date(fullVisitorSnapshot.checkInTime).getTime();
    if (diffMs > 0) {
      durationMinutes = Math.round(diffMs / 60000);
    }
  }

  const companionsSummary = fullVisitorSnapshot.companions && fullVisitorSnapshot.companions.length > 0
    ? fullVisitorSnapshot.companions.map(c => `${c.fullName}${c.badgeNumber ? ` (Gafete: ${c.badgeNumber})` : ''}`).join(", ")
    : undefined;

  // 3. Audit Log in background with rich metadata
  addAuditLog(
    actionName,
    id,
    fullVisitorSnapshot.fullName || updates.fullName || "Visitante",
    performedBy,
    logDetails,
    {
      origin,
      company: fullVisitorSnapshot.company,
      accessType: fullVisitorSnapshot.accessType,
      qrFolio: fullVisitorSnapshot.qrFolio,
      badgeNumber: fullVisitorSnapshot.badgeNumber,
      hostId: fullVisitorSnapshot.hostId,
      hostName: fullVisitorSnapshot.hostName,
      hostEmail: fullVisitorSnapshot.hostEmail,
      hostDepartment: fullVisitorSnapshot.department,
      visitorEmail: fullVisitorSnapshot.email,
      visitorPhone: fullVisitorSnapshot.phone,
      idType: fullVisitorSnapshot.idType,
      idNumber: fullVisitorSnapshot.idNumber,
      vehiclePlates: fullVisitorSnapshot.vehiclePlates,
      scheduledDateTime: fullVisitorSnapshot.scheduledDateTime,
      checkInTime: fullVisitorSnapshot.checkInTime,
      checkOutTime: fullVisitorSnapshot.checkOutTime,
      durationMinutes,
      companionsCount: fullVisitorSnapshot.companionCount || (fullVisitorSnapshot.companions?.length || 0),
      companionsSummary,
      rejectionOrCancelReason: updates.rejectionReason || updates.cancellationReason
    }
  ).catch(() => {});
}

export async function updateVisitor(
  id: string,
  updates: Partial<Visitor>,
  performedBy: string = "Administrador"
): Promise<void> {
  const now = new Date().toISOString();
  const mergedUpdates = { ...updates, updatedAt: now };

  // 1. Immediately update locally
  const currentList = getLocalVisitors();
  let existingVisitor: Visitor | undefined;
  const updatedList = currentList.map((v) => {
    if (v.id === id) {
      existingVisitor = v;
      return { ...v, ...mergedUpdates };
    }
    return v;
  });
  saveLocalVisitors(updatedList);

  const fullVisitorSnapshot: Partial<Visitor> = existingVisitor
    ? { ...existingVisitor, ...mergedUpdates }
    : { ...mergedUpdates };

  // 2. Sync to Firestore in background
  const ref = doc(db, "visitors", id);
  const sanitized = sanitizeForFirestore(mergedUpdates);
  updateDoc(ref, sanitized).catch((err) => {
    console.warn("Firestore updateVisitor background write warning:", err);
  });

  // 3. Audit Log in background
  addAuditLog(
    "EDIT_VISITOR",
    id,
    fullVisitorSnapshot.fullName || updates.fullName || "Visitante",
    performedBy,
    `Actualizados datos del visitante ${fullVisitorSnapshot.fullName || id} (${fullVisitorSnapshot.company || ''})`,
    {
      origin: performedBy.includes("Guardia") ? "CASETA" : "ADMIN_PORTAL",
      company: fullVisitorSnapshot.company,
      accessType: fullVisitorSnapshot.accessType,
      qrFolio: fullVisitorSnapshot.qrFolio,
      badgeNumber: fullVisitorSnapshot.badgeNumber,
      hostName: fullVisitorSnapshot.hostName,
      hostDepartment: fullVisitorSnapshot.department,
      visitorPhone: fullVisitorSnapshot.phone,
      visitorEmail: fullVisitorSnapshot.email,
      idNumber: fullVisitorSnapshot.idNumber,
      vehiclePlates: fullVisitorSnapshot.vehiclePlates
    }
  ).catch(() => {});
}

export async function deleteVisitor(
  id: string,
  param2: string = "Visitante",
  param3: string = "Administrador"
): Promise<void> {
  // 1. Immediately remove from local storage
  const currentList = getLocalVisitors();
  const deletedItem = currentList.find(v => v.id === id);
  const visitorName = deletedItem?.fullName || param2;
  const performedBy = param3 || (param2.includes("Guardia") || param2.includes("Admin") ? param2 : "Administrador");

  const updatedList = currentList.filter((v) => v.id !== id);
  saveLocalVisitors(updatedList);

  // 2. Sync to Firestore in background
  deleteDoc(doc(db, "visitors", id)).catch((err) => {
    console.warn("Firestore deleteVisitor background write warning:", err);
  });

  // 3. Audit Log in background
  addAuditLog(
    "DELETE_VISITOR",
    id,
    visitorName,
    performedBy,
    `Eliminado registro de visitante: ${visitorName} (Folio QR: ${deletedItem?.qrFolio || 'N/A'})`,
    {
      origin: performedBy.includes("Guardia") ? "CASETA" : "ADMIN_PORTAL",
      company: deletedItem?.company,
      accessType: deletedItem?.accessType,
      qrFolio: deletedItem?.qrFolio,
      badgeNumber: deletedItem?.badgeNumber,
      hostName: deletedItem?.hostName,
      hostDepartment: deletedItem?.department
    }
  ).catch(() => {});
}

/**
 * Calculates next available automatic badge code by visitor type
 * Supports excluding custom in-memory reserved badges (e.g. for companions or main visitor)
 */
export function getAvailableBadgeNumber(
  accessType: Visitor["accessType"],
  allVisitors: Visitor[],
  extraExcludedBadges: string[] = []
): string {
  const activeBadges = new Set<string>();

  // 1. Gather badges from visitors currently checked in
  allVisitors.forEach((v) => {
    if (v.status === "CHECKED_IN" && v.badgeNumber) {
      activeBadges.add(v.badgeNumber.trim().toUpperCase());
    }
    // Also include badges of checked-in companions
    if (v.status === "CHECKED_IN" && v.companions && Array.isArray(v.companions)) {
      v.companions.forEach((comp) => {
        if (comp.badgeNumber) {
          activeBadges.add(comp.badgeNumber.trim().toUpperCase());
        }
      });
    }
  });

  // 2. Exclude in-memory assigned badges in current form session
  extraExcludedBadges.forEach((b) => {
    if (b && b.trim()) {
      activeBadges.add(b.trim().toUpperCase());
    }
  });

  let prefix = "G-VIS";
  if (accessType === "Contratista") prefix = "G-CON";
  else if (accessType === "Proveedor") prefix = "G-PRO";
  else if (accessType === "Entrevista") prefix = "G-ENT";

  for (let i = 101; i <= 999; i++) {
    const candidate = `${prefix}-${i}`;
    if (!activeBadges.has(candidate)) {
      return candidate;
    }
  }

  return `${prefix}-${Math.floor(100 + Math.random() * 899)}`;
}

/**
 * Generates an array of unique available badge numbers sequentially
 */
export function getSequentialAvailableBadges(
  accessType: Visitor["accessType"],
  allVisitors: Visitor[],
  count: number,
  initialExcluded: string[] = []
): string[] {
  const result: string[] = [];
  const currentExcluded = [...initialExcluded];

  for (let i = 0; i < count; i++) {
    const badge = getAvailableBadgeNumber(accessType, allVisitors, currentExcluded);
    result.push(badge);
    currentExcluded.push(badge);
  }

  return result;
}


export async function addHost(hostData: Omit<Host, "id">): Promise<string> {
  const newRef = doc(collection(db, "hosts"));
  const host: Host = {
    ...hostData,
    id: newRef.id,
    createdAt: new Date().toISOString()
  };

  const currentList = getLocalHosts();
  const updatedList = [...currentList.filter(h => h.id !== host.id), host].sort((a, b) => a.fullName.localeCompare(b.fullName));
  saveLocalHosts(updatedList);

  const sanitized = sanitizeForFirestore(host);
  setDoc(newRef, sanitized).catch((err) => {
    console.warn("Firestore addHost background write warning:", err);
  });

  addAuditLog("HOST_CREATE", undefined, undefined, "Administrador", `Creado empleado: ${host.fullName} (${host.department})`).catch(() => {});
  return newRef.id;
}

export async function updateHost(id: string, updates: Partial<Host>): Promise<void> {
  const currentList = getLocalHosts();
  const updatedList = currentList.map((h) => {
    if (h.id === id) {
      return { ...h, ...updates };
    }
    return h;
  }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  saveLocalHosts(updatedList);

  const ref = doc(db, "hosts", id);
  const sanitized = sanitizeForFirestore(updates);
  updateDoc(ref, sanitized).catch((err) => {
    console.warn("Firestore updateHost background write warning:", err);
  });

  addAuditLog("HOST_UPDATE", undefined, undefined, "Administrador", `Actualizado empleado ID ${id}`).catch(() => {});
}

export async function deleteHost(id: string, name: string): Promise<void> {
  const currentList = getLocalHosts();
  const updatedList = currentList.filter((h) => h.id !== id);
  saveLocalHosts(updatedList);

  deleteDoc(doc(db, "hosts", id)).catch((err) => {
    console.warn("Firestore deleteHost background write warning:", err);
  });

  addAuditLog("HOST_DELETE", undefined, undefined, "Administrador", `Eliminado empleado: ${name}`).catch(() => {});
}

export async function updateAppConfig(config: AppConfig): Promise<void> {
  saveLocalConfig(config);
  const sanitized = sanitizeForFirestore(config);
  setDoc(doc(db, "app_config", "settings"), sanitized).catch((err) => {
    console.warn("Firestore updateAppConfig background write warning:", err);
  });
  addAuditLog("CONFIG_UPDATE", undefined, undefined, "Administrador", "Actualizada configuración de PINs de acceso").catch(() => {});
}

export async function addAuditLog(
  action: AuditLog["action"],
  visitorId?: string,
  visitorName?: string,
  performedBy: string = "Sistema",
  details: string = "",
  extraData: Partial<AuditLog> = {}
): Promise<void> {
  try {
    const logRef = doc(collection(db, "audit_logs"));
    const log: AuditLog = {
      id: logRef.id,
      timestamp: new Date().toISOString(),
      action,
      visitorId,
      visitorName,
      performedBy,
      details,
      ...extraData
    };

    const currentLogs = getLocalAuditLogs();
    saveLocalAuditLogs([log, ...currentLogs.slice(0, 499)]);

    const sanitized = sanitizeForFirestore(log);
    setDoc(logRef, sanitized).catch(() => {});
  } catch (e) {
    console.error("Error writing audit log:", e);
  }
}
