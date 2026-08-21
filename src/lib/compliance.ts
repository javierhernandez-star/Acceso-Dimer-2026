import { AccessType, VisitorProfile, Visitor, ComplianceRecord, ProfileCategory, DocumentValidityStatus } from "../types";

export interface CategoryInfo {
  id: AccessType;
  categoryKey: ProfileCategory;
  title: string;
  shortLabel: string;
  badge: string;
  description: string;
  documentationRequirements: string[];
  regulationType: "GENERAL" | "EHS_INDUSTRIAL" | "LOGISTICS" | "CONFIDENTIALITY";
  ruleBookTitle: string;
  ruleBookVersion: string;
  validityDays: number;
}

export const PROFILE_CATEGORIES: CategoryInfo[] = [
  {
    id: "Visita General",
    categoryKey: "GENERAL",
    title: "General / Cliente",
    shortLabel: "General / Comercial",
    badge: "Reuniones & Negocios",
    description: "Reuniones corporativas, comerciales recurrentes o atención a clientes y visitas institucionales.",
    documentationRequirements: [
      "Identificación oficial (INE o Pasaporte vigente)",
      "Registro de acompañantes (si aplica)",
      "Lectura y conformidad del Reglamento General de Visitas"
    ],
    regulationType: "GENERAL",
    ruleBookTitle: "Reglamento General de Acceso y Visitas Corporativas",
    ruleBookVersion: "v2026_1_REG_GEN.pdf",
    validityDays: 365
  },
  {
    id: "Entrevista",
    categoryKey: "CANDIDATE",
    title: "Candidato / Entrevista",
    shortLabel: "Atracción de Talento",
    badge: "Procesos de Selección",
    description: "Candidatos a vacantes y procesos de reclutamiento de personal (visitas puntuales de 1 o 2 ocasiones).",
    documentationRequirements: [
      "Identificación básica oficial (INE / Pasaporte)",
      "Puesto postulado y folio de vacante (sin solicitar información de más)",
      "Reglamento de Conducta y Seguridad en Instalaciones"
    ],
    regulationType: "GENERAL",
    ruleBookTitle: "Lineamientos de Conducta y Privacidad para Candidatos",
    ruleBookVersion: "v2026_1_REG_CAND.pdf",
    validityDays: 180
  },
  {
    id: "Proveedor",
    categoryKey: "SUPPLIER",
    title: "Proveedor / Comercial",
    shortLabel: "Compras y Suministros",
    badge: "Atención a Compras",
    description: "Atención a compras, venta de insumos, servicios comerciales o auditorías de suministros.",
    documentationRequirements: [
      "Identificación oficial vigente (INE / Pasaporte)",
      "Firma y vigencia de Acuerdo de Confidencialidad (NDA anual)",
      "Datos de facturación o remisión de insumos"
    ],
    regulationType: "CONFIDENTIALITY",
    ruleBookTitle: "Acuerdo de Confidencialidad (NDA) y Código de Ética con Proveedores",
    ruleBookVersion: "v2026_1_NDA_PROV.pdf",
    validityDays: 365
  },
  {
    id: "Contratista",
    categoryKey: "CONTRACTOR",
    title: "Contratista / Mantenimiento",
    shortLabel: "Trabajos Operativos y Obra",
    badge: "Seguridad Industrial EHS / STPS",
    description: "Trabajos operativos, obras civiles, mantenimiento técnico o actividades con riesgo en sitio.",
    documentationRequirements: [
      "Identificación oficial (INE vigente)",
      "Pago Obrero-Patronal IMSS vigente (Comprobante SUA / Emisión mensual)",
      "Constancia de Habilidades Laborales DC-3 (STPS según tipo de actividad)",
      "Examen / Certificado Antidoping vigente (para trabajos operativos / maquinaria)",
      "Plan de Trabajo / Descripción de actividades y Orden de Trabajo (PO)",
      "Análisis de Seguridad en el Trabajo (AST) y Permiso de Alto Riesgo por cita",
      "Inducción de Seguridad Industrial y Salud Ocupacional EHS (STPS)"
    ],
    regulationType: "EHS_INDUSTRIAL",
    ruleBookTitle: "Manual de Inducción de Seguridad Industrial y Salud Ocupacional (EHS - STPS)",
    ruleBookVersion: "v2026_1_EHS_STPS.pdf",
    validityDays: 365
  },
  {
    id: "Transportista",
    categoryKey: "LOGISTICS",
    title: "Transportista / Logística",
    shortLabel: "Andenes & Embarques",
    badge: "Cadena de Suministro C-TPAT",
    description: "Entrega o recolección de mercancías, maniobras de carga y descarga en andenes y patios de maniobras.",
    documentationRequirements: [
      "Licencia de conducir de transporte federal o estatal vigente",
      "Póliza de seguro vehicular y de remolque vigente",
      "Carta Porte / Folio de Remisión obligatorio por cada viaje o embarque",
      "Protocolo de Seguridad en Andenes y Patio de Maniobras"
    ],
    regulationType: "LOGISTICS",
    ruleBookTitle: "Reglamento de Tránsito Interno, Patios de Maniobras y Andenes C-TPAT",
    ruleBookVersion: "v2026_1_LOG_PATIOS.pdf",
    validityDays: 365
  }
];

export function getCategoryInfo(accessType: AccessType): CategoryInfo {
  const match = PROFILE_CATEGORIES.find((c) => c.id === accessType);
  return match || PROFILE_CATEGORIES[0];
}

/**
 * Checks all documents and compliance statuses for a visitor profile or appointment
 */
export function evaluateVisitorValidity(record: Partial<Visitor | VisitorProfile>): DocumentValidityStatus {
  const now = new Date();
  const issues: string[] = [];
  const warnings: string[] = [];

  // 1. Check Compliance / Induction Validity (EHS / NDA / General)
  let isComplianceValid = false;
  let complianceExpired = false;

  const inductionExp = record.safetyInductionValidUntil || record.complianceRecord?.fecha_expiracion_induccion;
  if (inductionExp) {
    const expDate = new Date(inductionExp);
    if (!isNaN(expDate.getTime())) {
      if (expDate >= now) {
        isComplianceValid = true;
      } else {
        complianceExpired = true;
        issues.push(`Inducción / Aceptación de Reglamento EHS vencida el ${expDate.toLocaleDateString("es-MX")}`);
      }
    }
  }

  // 2. Contractor IMSS validation (Monthly validity)
  let isImssValid = true;
  if (record.accessType === "Contratista") {
    const imssExp = record.contractorDetails?.imssExpirationDate || record.imssExpirationDate;
    if (imssExp) {
      const expDate = new Date(imssExp);
      if (!isNaN(expDate.getTime()) && expDate < now) {
        isImssValid = false;
        issues.push(`Comprobante de IMSS mensual vencido el ${expDate.toLocaleDateString("es-MX")}`);
      }
    } else if (!record.imssNumber && !record.contractorDetails?.imssInsuranceNum) {
      warnings.push("Falta registrar número de seguro social IMSS");
    }
  }

  // 3. Supplier NDA validation (Annual validity)
  let isNdaValid = true;
  if (record.accessType === "Proveedor") {
    const ndaExp = record.supplierDetails?.ndaExpirationDate || record.ndaExpirationDate;
    if (ndaExp) {
      const expDate = new Date(ndaExp);
      if (!isNaN(expDate.getTime()) && expDate < now) {
        isNdaValid = false;
        issues.push(`Acuerdo de Confidencialidad (NDA) vencido el ${expDate.toLocaleDateString("es-MX")}`);
      }
    }
  }

  // 4. Logistics / Insurance validation
  let isInsuranceValid = true;
  if (record.accessType === "Transportista") {
    const insExp = record.logisticsDetails?.insurancePolicyExpiration || record.insuranceExpirationDate;
    if (insExp) {
      const expDate = new Date(insExp);
      if (!isNaN(expDate.getTime()) && expDate < now) {
        isInsuranceValid = false;
        issues.push(`Póliza de seguro vehicular vencida el ${expDate.toLocaleDateString("es-MX")}`);
      }
    }
  }

  // 5. Check mandatory per-visit requirements
  let missingPerVisitDocs: string[] = [];
  if (record.accessType === "Contratista") {
    const vis = record as Visitor;
    if (vis.scheduledDateTime) { // It's an appointment
      if (!vis.contractorDetails?.astPermitFolio && !vis.contractorDetails?.highRiskPermit && !vis.workOrder && !vis.contractorDetails?.workOrderPo) {
        missingPerVisitDocs.push("Análisis de Riesgo (AST) / Folio de Orden de Trabajo");
      }
    }
  }

  if (record.accessType === "Transportista") {
    const vis = record as Visitor;
    if (vis.scheduledDateTime) {
      if (!vis.logisticsDetails?.waybillOrRemissionFolio && !vis.supplierDetails?.invoiceOrWaybill) {
        missingPerVisitDocs.push("Carta Porte / Folio de Remisión por Embarque");
      }
    }
  }

  const isValidOverall = issues.length === 0;

  return {
    isValidOverall,
    isComplianceValid,
    complianceExpired,
    isImssValid,
    isNdaValid,
    isInsuranceValid,
    issues,
    warnings,
    missingPerVisitDocs
  };
}

/**
 * Text bodies for regulations and compliance viewer
 */
export const COMPLIANCE_TEXTS = {
  GENERAL: `
POLÍTICA Y REGLAMENTO GENERAL DE SEGURIDAD PARA VISITANTES Y CLIENTES

1. ACCESO E IDENTIFICACIÓN
• Todo visitante deberá registrarse obligatoriamente en caseta principal y portar en lugar visible el Gafete Institucional durante toda su permanencia.
• El acceso a las instalaciones es exclusivamente para las áreas autorizadas por el anfitrión responsable.

2. NORMAS DE CONDUCTA Y SEGURIDAD
• Queda estrictamente prohibido fumar, ingresar bajo la influencia de sustancias alcohólicas o estupefacientes, o portar armas de cualquier tipo.
• Se prohíbe la toma de fotografías, videos o grabaciones de audio dentro de las instalaciones productivas sin previa autorización por escrito de la Gerencia de Operaciones.
• Respete las líneas peatonales delimitadas en color amarillo y evite transitar por pasillos de montacargas o zonas operativas no asignadas.

3. EMERGENCIAS Y EVACUACIÓN
• En caso de activación de alarma sonora de evacuación, mantenga la calma y siga estrictamente las indicaciones de los Brigadistas y su Anfitrión hacia el Punto de Reunión más cercano.
• En caso de incidente o malestar de salud, notifique de inmediato a su anfitrión para recibir atención en el Servicio Médico de Planta.
  `,

  CANDIDATE: `
LINEAMIENTOS DE CONDUCTA Y CONFIDENCIALIDAD PARA CANDIDATOS EN PROCESOS DE SELECCIÓN

1. BIENVENIDA Y PROPÓSITO
• Su visita tiene como único fin la realización de entrevistas, evaluaciones psicométricas o técnicas correspondientes a su postulación laboral.
• Se solicita puntualidad y permanencia en la Sala de Espera de Recursos Humanos hasta ser recibido por el evaluador.

2. PROTECCIÓN DE DATOS PERSONALES
• La información proporcionada durante su proceso será tratada conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y nuestro Aviso de Privacidad.
• Los datos recabados no serán transferidos a terceros sin su consentimiento expreso.

3. NORMAS DE ACCESO
• Deberá portar su gafete de candidato en todo momento y no desplazarse hacia áreas de producción o talleres sin acompañamiento del personal de Atracción de Talento.
  `,

  CONFIDENTIALITY: `
ACUERDO DE CONFIDENCIALIDAD (NDA) Y CÓDIGO DE ÉTICA PARA PROVEEDORES

1. OBLIGACIÓN DE CONFIDENCIALIDAD
El Proveedor se obliga a mantener en estricta reserva y confidencialidad toda información técnica, comercial, financiera, planos, especificaciones, formulaciones o secretos industriales a los que tenga acceso durante su visita o relación comercial.

2. PROHIBICIÓN DE DIVULGACIÓN
Queda prohibida la reproducción total o parcial de documentos, toma de fotografías de líneas de producción o transmisión de información a terceros sin autorización previa y por escrito de la Dirección General.

3. VIGENCIA Y RESPONSABILIDAD
Este acuerdo tendrá una vigencia ininterrumpida de doce (12) meses a partir de la fecha de aceptación electrónica. El incumplimiento dará lugar a las acciones legales correspondientes de conformidad con la legislación mercantil y penal aplicable.
  `,

  EHS_INDUSTRIAL: `
MANUAL DE INDUCCIÓN DE SEGURIDAD INDUSTRIAL Y SALUD OCUPACIONAL (EHS - STPS)

1. EQUIPO DE PROTECCIÓN PERSONAL OBLIGATORIO (EPP BÁSICO)
Para ingresar a cualquier nave productiva, patio operativo o área de mantenimiento, todo contratista debe portar EPP certificado:
• Casco de seguridad dieléctrico clase E.
• Calzado de seguridad con casquillo de protección certificado (NOM-113-STPS).
• Lentes de seguridad con protección lateral contra impactos (ANSI Z87.1).
• Chaleco de alta visibilidad con cintas reflejantes.

2. SEGURIDAD SOCIAL Y AFILIACIÓN (IMSS)
• Es requisito indispensable contar con afiliación y pago mensual vigente ante el Instituto Mexicano del Seguro Social (IMSS).
• En caso de trabajadores no dados de alta, se les negará rotundamente el acceso sin excepción.

3. TRABAJOS DE ALTO RIESGO Y PERMISOS OBLIGATORIOS
• Requieren Permiso de Trabajo y Análisis de Seguridad en la Tarea (AST) validado por Seguridad EHS previo al inicio:
  a) Trabajos en alturas (a partir de 1.80 m).
  b) Trabajos en caliente (corte y soldadura).
  c) Trabajos en espacios confinados.
  d) Bloqueo y etiquetado de energías peligrosas (LOTO).
• Las herramientas eléctricas deben contar con clavija aterrizada e inspección visual aprobada.

4. POLÍTICA DE TOLERANCIA CERO
• Cualquier acto inseguro grave o violación de este reglamento implicará la suspensión inmediata del trabajo y retiro de la planta.
  `,

  LOGISTICS: `
REGLAMENTO DE TRÁNSITO INTERNO, PATIOS DE MANIOBRAS Y ANDENES (C-TPAT)

1. VELOCIDAD Y CIRCULACIÓN
• La velocidad máxima en patios y vialidades internas es de 10 km/h con luces intermitentes encendidas.
• Se prohíbe el uso de teléfonos celulares mientras se conduce dentro del recinto de la planta.

2. MANIOBRAS EN ANDENES
• Todo tractocamión o unidad debe colocar calzas de seguridad en las ruedas traseras antes de iniciar la carga o descarga.
• El operador debe apagar el motor y entregar la llave al personal del almacén durante la maniobra si así se le requiere.

3. DOCUMENTACIÓN OBLIGATORIA
• Es indispensable presentar Carta Porte / Remisión oficial con desglose de materiales o productos.
• Póliza de seguro vigente con cobertura de responsabilidad civil y daños a terceros.
  `
};
