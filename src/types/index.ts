export type UserRole = 'ADMIN' | 'GUARD' | 'HOST' | 'VISITOR';

export type AccessType = 'Visita General' | 'Proveedor' | 'Contratista' | 'Entrevista';

export type IdType = 'INE' | 'Licencia' | 'Pasaporte' | 'Gafete' | 'Otro';

export type VisitorStatus =
  | 'PENDING'
  | 'PENDING_EXPRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT';

export interface ContractorDetails {
  workOrderPo?: string;
  imssInsuranceNum?: string;
  hasEpp?: boolean;
  highRiskPermit?: boolean;
  highRiskType?: string;
}

export interface SupplierDetails {
  invoiceOrWaybill?: string;
  cargoType?: string;
  trailerPlates?: string;
  materialsDescription?: string;
}

export interface InterviewDetails {
  jobPositionApplied?: string;
  recruiterName?: string;
  vacancyFolio?: string;
}

export interface Companion {
  id?: string;
  fullName: string;
  idNumber?: string;
  company?: string;
  badgeNumber?: string;
}

export interface GeneralDetails {
  visitReason?: string;
  companionCount?: number;
  companions?: Companion[];
}

export interface VisitorProfile {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  idType: IdType;
  idNumber: string;
  accessType: AccessType;
  vehiclePlates?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  companyRfc?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  imssNumber?: string;
  dc3Certification?: string;
  eppItems?: string[];
  safetyInductionValidUntil?: string;
  authorizedZones?: string[];
  notes?: string;
  totalVisits?: number;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  idType: IdType;
  idNumber: string;
  accessType: AccessType;
  hostId: string;
  hostName: string;
  hostEmail: string;
  department: string;
  zone: string;
  scheduledDateTime: string;
  scheduledDate?: string;
  vehiclePlates?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  companyRfc?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  imssNumber?: string;
  dc3Certification?: string;
  eppItems?: string[];
  safetyInductionValidUntil?: string;
  authorizedZones?: string[];
  healthDeclaration: boolean;
  healthNotes?: string;
  status: VisitorStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  cancellationBy?: string;
  cancelledAt?: string;
  badgeNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  qrFolio: string;
  createdAt: string;
  updatedAt: string;
  isExpress?: boolean;
  isExternal?: boolean;
  equipmentRegistered?: string;
  tools?: string;
  workOrder?: string;
  purchaseOrder?: string;
  cargoType?: string;
  safetyEquipment?: string;
  interviewPosition?: string;
  companionCount?: number;
  companions?: Companion[];
  
  // Specific Type Details
  contractorDetails?: ContractorDetails;
  supplierDetails?: SupplierDetails;
  interviewDetails?: InterviewDetails;
  generalDetails?: GeneralDetails;
}

export interface Host {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employeeNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  shift?: string;
  officeExtension?: string;
  workLocation?: string;
  safetyCertifications?: string[];
  supervisorName?: string;
  hireDate?: string;
  role?: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  pin?: string;
  passwordPin?: string;
  createdAt?: string;
}

export interface Employee extends Host {
  role: UserRole;
  passwordPin: string;
}

export interface EmailNotificationLog {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  subject: string;
  bodyHtml: string;
  eventType: 'SOLICITUD' | 'APROBACION' | 'RECHAZO' | 'CANCELACION' | 'EXPRESS_CHECKIN';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING_GMAIL_AUTH';
  visitorId?: string;
  visitorName?: string;
  qrFolio?: string;
}

export interface NotificationTriggerRecipient {
  email: string;
  role: 'VISITOR' | 'HOST';
}

export interface NotificationTrigger {
  id: string;
  type: 'NEW_CITATION' | 'PRE_REGISTRATION' | 'SOLICITUD' | 'APROBACION' | 'RECHAZO' | 'CANCELACION' | 'EXPRESS_CHECKIN';
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  visitorId: string;
  visitorName: string;
  visitorEmail: string;
  hostName: string;
  hostEmail: string;
  company: string;
  accessType: AccessType;
  qrFolio: string;
  badgeNumber?: string;
  scheduledDateTime: string;
  extraMessage?: string;
  recipients: NotificationTriggerRecipient[];
  visitorData?: Partial<Visitor>;
  processedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action:
    | 'PRE_REGISTER'
    | 'EXPRESS_REGISTER'
    | 'APPROVE'
    | 'REJECT'
    | 'CANCEL'
    | 'CHECK_IN'
    | 'CHECK_OUT'
    | 'EDIT_VISITOR'
    | 'DELETE_VISITOR'
    | 'HOST_CREATE'
    | 'HOST_UPDATE'
    | 'HOST_DELETE'
    | 'CONFIG_UPDATE'
    | string;
  visitorId?: string;
  visitorName?: string;
  performedBy: string;
  performedByRole?: string;
  performedByEmail?: string;
  origin?: 'CASETA' | 'WEB_PREREGISTER' | 'HOST_PORTAL' | 'ADMIN_PORTAL' | 'SISTEMA' | string;
  company?: string;
  accessType?: AccessType | string;
  qrFolio?: string;
  badgeNumber?: string;
  hostId?: string;
  hostName?: string;
  hostEmail?: string;
  hostDepartment?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  idType?: string;
  idNumber?: string;
  vehiclePlates?: string;
  scheduledDateTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  durationMinutes?: number;
  companionsCount?: number;
  companionsSummary?: string;
  rejectionOrCancelReason?: string;
  ipAddress?: string;
  location?: string;
  details: string;
}

export interface AppConfig {
  guardPin: string;
  adminPin: string;
  companyName: string;
  defaultHostPin?: string;
  noReplyEmail?: string;
  noReplySenderName?: string;
  appsScriptWebhookUrl?: string;
}


