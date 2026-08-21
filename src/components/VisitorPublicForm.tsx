import React, { useState, useEffect } from "react";
import { Visitor, Host, AccessType, IdType, VisitorProfile, ComplianceRecord } from "../types";
import { addVisitor, subscribeHosts, subscribeVisitors, subscribeVisitorProfiles } from "../lib/firebase";
import { sendNoReplyEmailNotification } from "../lib/notifications";
import { generateQRFolio, formatSpanishDate, getCleanPublicVisitorUrl } from "../lib/utils";
import { PROFILE_CATEGORIES, getCategoryInfo, evaluateVisitorValidity } from "../lib/compliance";
import { sendVisitorVerificationPin, verifyVisitorPin } from "../lib/visitorPinAuth";
import { DigitalPassModal } from "./DigitalPassModal";
import { RegulationComplianceModal } from "./RegulationComplianceModal";
import {
  Building2, User, Mail, Phone, Shield, FileText, Calendar, Car, CheckSquare,
  Send, CheckCircle2, QrCode, Search, Sparkles, HardHat, Truck, AlertCircle, Clock, XCircle,
  KeyRound, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, Lock, AlertTriangle, ChevronRight, Check
} from "lucide-react";

interface VisitorPublicFormProps {
  preselectedHostId?: string;
}

export const VisitorPublicForm: React.FC<VisitorPublicFormProps> = ({ preselectedHostId }) => {
  const [activeTab, setActiveTab] = useState<"register" | "lookup">("register");
  const [hosts, setHosts] = useState<Host[]>([]);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [allProfiles, setAllProfiles] = useState<VisitorProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVisitor, setCreatedVisitor] = useState<Visitor | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);

  // Status Lookup state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Visitor | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // =========================================================================
  // STEPPING FLOW: 
  // Step 0: Profile Selection & Requirements Explanation
  // Step 1: Email Input & PIN Verification (Zero-knowledge for returning visitors)
  // Step 2: Main Form with Selective Document Requirements & Validity Rules
  // =========================================================================
  const [registrationStep, setRegistrationStep] = useState<0 | 1 | 2>(0);
  const [selectedAccessType, setSelectedAccessType] = useState<AccessType>("Visita General");
  
  // Email & PIN Validation Flow
  const [emailInput, setEmailInput] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [devPinNotification, setDevPinNotification] = useState<string | null>(null);
  const [matchedProfileData, setMatchedProfileData] = useState<VisitorProfile | Visitor | null>(null);

  // Compliance & Induction Modal
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceRecord, setComplianceRecord] = useState<ComplianceRecord | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<IdType>("INE");
  const [idNumber, setIdNumber] = useState("");
  const [selectedHostId, setSelectedHostId] = useState(preselectedHostId || "");
  const [department, setDepartment] = useState("Oficinas / Gerencia");
  const [zone, setZone] = useState("Edificio Administrativo - Oficinas");

  // Dynamic fields
  // Contratista
  const [workOrderPo, setWorkOrderPo] = useState("");
  const [imssInsuranceNum, setImssInsuranceNum] = useState("");
  const [imssExpirationDate, setImssExpirationDate] = useState("");
  const [suaPaymentProof, setSuaPaymentProof] = useState("");
  const [dc3Certification, setDc3Certification] = useState("");
  const [antidopingCertificate, setAntidopingCertificate] = useState("");
  const [workPlanDescription, setWorkPlanDescription] = useState("");
  const [astPermitFolio, setAstPermitFolio] = useState("");
  const [hasEpp, setHasEpp] = useState(true);
  const [highRiskPermit, setHighRiskPermit] = useState(false);
  const [highRiskType, setHighRiskType] = useState("Trabajos en Alturas");

  // Proveedor
  const [invoiceOrWaybill, setInvoiceOrWaybill] = useState("");
  const [cargoType, setCargoType] = useState("Insumos de Producción");
  const [trailerPlates, setTrailerPlates] = useState("");
  const [materialsDescription, setMaterialsDescription] = useState("");
  const [ndaExpirationDate, setNdaExpirationDate] = useState("");

  // Transportista / Logística
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insurancePolicyExpiration, setInsurancePolicyExpiration] = useState("");
  const [waybillOrRemissionFolio, setWaybillOrRemissionFolio] = useState("");

  // Entrevista
  const [jobPositionApplied, setJobPositionApplied] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [vacancyFolio, setVacancyFolio] = useState("");

  // General
  const [visitReason, setVisitReason] = useState("");
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [companionsList, setCompanionsList] = useState<{ fullName: string; idNumber: string; company: string }[]>([]);

  // Schedule default: tomorrow at 10:00 AM
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(10, 0, 0, 0);
  const defaultDateStr = defaultDate.toISOString().slice(0, 16);

  const [scheduledDateTime, setScheduledDateTime] = useState(defaultDateStr);
  const [vehiclePlates, setVehiclePlates] = useState("");
  const [equipmentRegistered, setEquipmentRegistered] = useState("");

  // Health & Safety acceptance
  const [noSymptoms, setNoSymptoms] = useState(true);
  const [acceptSecurityPolicy, setAcceptSecurityPolicy] = useState(true);

  // Subscribe to real-time hosts, visitors and profiles
  useEffect(() => {
    const unsubHosts = subscribeHosts((data) => {
      const activeHosts = data.filter((h) => h.status === "ACTIVE");
      setHosts(activeHosts);
      if (!selectedHostId && activeHosts.length > 0) {
        setSelectedHostId(activeHosts[0].id);
        setDepartment(activeHosts[0].department);
      }
    });

    const unsubVisitors = subscribeVisitors((data) => {
      setAllVisitors(data);
    });

    const unsubProfiles = subscribeVisitorProfiles((data) => {
      setAllProfiles(data);
    });

    return () => {
      unsubHosts();
      unsubVisitors();
      unsubProfiles();
    };
  }, []);

  // Update companions array size when companionCount changes
  const handleCompanionCountChange = (count: number) => {
    const validCount = Math.max(0, Math.min(20, count));
    setCompanionCount(validCount);
    setCompanionsList((prev) => {
      const next = [...prev];
      if (next.length < validCount) {
        for (let i = next.length; i < validCount; i++) {
          next.push({ fullName: "", idNumber: "", company: "" });
        }
      } else {
        next.splice(validCount);
      }
      return next;
    });
  };

  const handleCompanionFieldChange = (index: number, field: "fullName" | "idNumber" | "company", value: string) => {
    setCompanionsList((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Step 0: Profile selection
  const handleSelectProfileCategory = (type: AccessType) => {
    setSelectedAccessType(type);
    // Reset any step 1 credentials
    setEmailInput("");
    setPinSent(false);
    setPinInput("");
    setPinError(null);
    setMatchedProfileData(null);
    setRegistrationStep(1);
  };

  // Step 1: Handle Email Check for Existing vs New Visitor
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Por favor ingrese un correo electrónico válido.");
      return;
    }

    setIsCheckingEmail(true);
    setPinError(null);
    setDevPinNotification(null);

    try {
      // Find matching existing visitor in profile directory or past visits
      const foundProfile = allProfiles.find(
        (p) => p.email && p.email.trim().toLowerCase() === cleanEmail
      );
      const foundPastVisitor = !foundProfile
        ? allVisitors.find((v) => v.email && v.email.trim().toLowerCase() === cleanEmail)
        : null;

      const existingRecord = foundProfile || foundPastVisitor;

      if (existingRecord) {
        // Visitor EXISTS: Trigger 4-Digit PIN with Zero-Knowledge (no data rendered yet)
        setIsReturningVisitor(true);
        const result = await sendVisitorVerificationPin(cleanEmail, existingRecord);
        setPinSent(true);
        if (result.pinForDev) {
          setDevPinNotification(`PIN enviado a ${cleanEmail}: ${result.pinForDev}`);
        }
      } else {
        // Visitor DOES NOT EXIST: Proceed straight to Step 2 with clean form
        setIsReturningVisitor(false);
        setEmail(cleanEmail);
        setFullName("");
        setCompany("");
        setPhone("");
        setIdNumber("");
        setVehiclePlates("");
        setMatchedProfileData(null);
        setRegistrationStep(2);
      }
    } catch (err) {
      console.error("Error during email check:", err);
      // Fallback to step 2 if offline
      setEmail(cleanEmail);
      setRegistrationStep(2);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Step 1: Validate 4-digit PIN for Returning Visitor
  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const result = verifyVisitorPin(emailInput, pinInput);
    if (!result.valid || !result.visitorData) {
      setPinError(result.error || "PIN inválido.");
      return;
    }

    // PIN SUCCESS: Load only reusable fixed data + evaluate document validities
    const record = result.visitorData as VisitorProfile | Visitor;
    setMatchedProfileData(record);
    populateWithValidityRules(record);
    setRegistrationStep(2);
  };

  // Populate form applying the validity rules from the prompt
  const populateWithValidityRules = (v: VisitorProfile | Visitor) => {
    // 1. REUSABLE FIXED DATA (Do not ask again)
    setFullName(v.fullName || "");
    setCompany(v.company || "");
    setEmail(v.email || emailInput.trim().toLowerCase());
    setPhone(v.phone || "");
    setIdType(v.idType || "INE");
    setIdNumber(v.idNumber || "");
    if (v.vehiclePlates) setVehiclePlates(v.vehiclePlates);

    const now = new Date();

    // 2. DOCUMENT VALIDITY CHECKS (Ask only if expired or changed)
    // Compliance & Regulation Inductions
    const complianceRec = v.complianceRecord;
    const inductionExp = v.safetyInductionValidUntil || complianceRec?.fecha_expiracion_induccion;
    if (inductionExp && new Date(inductionExp) >= now && complianceRec) {
      setComplianceRecord(complianceRec);
    } else {
      setComplianceRecord(null); // Will require reading/signing if expired
    }

    // Contratista: IMSS validity check (monthly) & STPS DC-3 / Antidoping
    const vis = v as Visitor;
    if (vis.contractorDetails) {
      if (vis.contractorDetails.imssInsuranceNum) setImssInsuranceNum(vis.contractorDetails.imssInsuranceNum);
      if (vis.contractorDetails.suaPaymentProof) setSuaPaymentProof(vis.contractorDetails.suaPaymentProof);
      if (vis.contractorDetails.dc3Certification) setDc3Certification(vis.contractorDetails.dc3Certification);
      if (vis.contractorDetails.antidopingCertificate) setAntidopingCertificate(vis.contractorDetails.antidopingCertificate);
      if (vis.contractorDetails.hasEpp !== undefined) setHasEpp(vis.contractorDetails.hasEpp);
      if (vis.contractorDetails.highRiskPermit !== undefined) setHighRiskPermit(vis.contractorDetails.highRiskPermit);
      if (vis.contractorDetails.highRiskType) setHighRiskType(vis.contractorDetails.highRiskType);
      
      const imssExp = vis.contractorDetails.imssExpirationDate || v.imssExpirationDate;
      if (imssExp && new Date(imssExp) >= now) {
        setImssExpirationDate(imssExp);
      } else {
        setImssExpirationDate(""); // Expired: must upload/confirm new monthly IMSS
      }
    } else if (v.imssNumber) {
      setImssInsuranceNum(v.imssNumber);
      if (v.dc3Certification) setDc3Certification(v.dc3Certification);
      if (v.suaPaymentProof) setSuaPaymentProof(v.suaPaymentProof);
      if (v.antidopingCertificate) setAntidopingCertificate(v.antidopingCertificate);
    }

    // Proveedor: NDA validity check (annual)
    if (vis.supplierDetails) {
      if (vis.supplierDetails.cargoType) setCargoType(vis.supplierDetails.cargoType);
      if (vis.supplierDetails.trailerPlates) setTrailerPlates(vis.supplierDetails.trailerPlates);
      if (vis.supplierDetails.materialsDescription) setMaterialsDescription(vis.supplierDetails.materialsDescription);
      
      const ndaExp = vis.supplierDetails.ndaExpirationDate || v.ndaExpirationDate;
      if (ndaExp && new Date(ndaExp) >= now) {
        setNdaExpirationDate(ndaExp);
      } else {
        setNdaExpirationDate(""); // Expired: must re-sign NDA
      }
    }

    // Transportista: Insurance policy check
    if (vis.logisticsDetails) {
      if (vis.logisticsDetails.driverLicenseNumber) setDriverLicenseNumber(vis.logisticsDetails.driverLicenseNumber);
      if (vis.logisticsDetails.trailerPlates) setTrailerPlates(vis.logisticsDetails.trailerPlates);
      
      const insExp = vis.logisticsDetails.insurancePolicyExpiration || v.insuranceExpirationDate;
      if (insExp && new Date(insExp) >= now) {
        setInsurancePolicyExpiration(insExp);
        if (vis.logisticsDetails.insurancePolicyNumber) setInsurancePolicyNumber(vis.logisticsDetails.insurancePolicyNumber);
      } else {
        setInsurancePolicyExpiration(""); // Expired: must provide new policy
      }
    }

    // 3. MANDATORY PER-VISIT FIELDS (Always require fresh)
    setAstPermitFolio("");
    setWorkOrderPo("");
    setInvoiceOrWaybill("");
    setWaybillOrRemissionFolio("");
    setVisitReason("");
    setCompanionCount(0);
    setCompanionsList([]);
  };

  const handleHostChange = (hostId: string) => {
    setSelectedHostId(hostId);
    const host = hosts.find((h) => h.id === hostId);
    if (host) {
      setDepartment(host.department);
    }
  };

  // Status Lookup handler
  const handleLookupStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 4) {
      alert("Por motivos de seguridad y confidencialidad, ingrese al menos 4 caracteres para consultar su cita (ej. folio completo, correo o teléfono).");
      return;
    }

    setHasSearched(true);
    const found = allVisitors.find((v) => {
      return (
        v.qrFolio.toLowerCase() === q ||
        v.email.toLowerCase() === q ||
        (q.length >= 4 && v.phone.toLowerCase().includes(q)) ||
        v.idNumber.toLowerCase() === q
      );
    });

    setSearchResult(found || null);
  };

  // Submit Final Appointment Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !company || !email || !phone || !idNumber) {
      alert("Por favor complete todos los campos obligatorios (*).");
      return;
    }

    // If compliance is required and not yet signed or valid
    const category = getCategoryInfo(selectedAccessType);
    const hasValidCompliance = complianceRecord && new Date(complianceRecord.fecha_expiracion_induccion) >= new Date();

    if (!hasValidCompliance) {
      setShowComplianceModal(true);
      return;
    }

    if (!acceptSecurityPolicy) {
      alert("Debe aceptar el protocolo de seguridad de la planta para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedHost = hosts.find((h) => h.id === selectedHostId) || hosts[0];
      const folio = generateQRFolio();
      const now = new Date().toISOString();

      const validCompanions = companionsList.filter((c) => c.fullName.trim() !== "");

      const typeSpecificData: Partial<Visitor> = {};

      if (selectedAccessType === "Contratista") {
        typeSpecificData.contractorDetails = {
          workOrderPo: workOrderPo.trim(),
          imssInsuranceNum: imssInsuranceNum.trim(),
          imssExpirationDate: imssExpirationDate || undefined,
          suaPaymentProof: suaPaymentProof.trim(),
          dc3Certification: dc3Certification.trim(),
          antidopingCertificate: antidopingCertificate.trim(),
          workPlanDescription: workPlanDescription.trim(),
          astPermitFolio: astPermitFolio.trim(),
          hasEpp,
          highRiskPermit,
          highRiskType: highRiskPermit ? highRiskType : ""
        };
        typeSpecificData.imssNumber = imssInsuranceNum.trim();
        typeSpecificData.imssExpirationDate = imssExpirationDate || undefined;
        typeSpecificData.suaPaymentProof = suaPaymentProof.trim();
        typeSpecificData.dc3Certification = dc3Certification.trim();
        typeSpecificData.antidopingCertificate = antidopingCertificate.trim();
        typeSpecificData.workPlanDescription = workPlanDescription.trim();
      } else if (selectedAccessType === "Proveedor") {
        typeSpecificData.supplierDetails = {
          invoiceOrWaybill: invoiceOrWaybill.trim(),
          cargoType: cargoType.trim(),
          trailerPlates: trailerPlates.trim().toUpperCase(),
          materialsDescription: materialsDescription.trim(),
          ndaSignedDate: complianceRecord?.fecha_aceptacion,
          ndaExpirationDate: complianceRecord?.fecha_expiracion_induccion || ndaExpirationDate || undefined
        };
        typeSpecificData.ndaSignedDate = complianceRecord?.fecha_aceptacion;
        typeSpecificData.ndaExpirationDate = complianceRecord?.fecha_expiracion_induccion || ndaExpirationDate || undefined;
      } else if (selectedAccessType === "Transportista") {
        typeSpecificData.logisticsDetails = {
          driverLicenseNumber: driverLicenseNumber.trim() || idNumber.trim(),
          insurancePolicyNumber: insurancePolicyNumber.trim(),
          insurancePolicyExpiration: insurancePolicyExpiration || undefined,
          waybillOrRemissionFolio: waybillOrRemissionFolio.trim(),
          trailerPlates: trailerPlates.trim().toUpperCase()
        };
        typeSpecificData.insurancePolicyNumber = insurancePolicyNumber.trim();
        typeSpecificData.insuranceExpirationDate = insurancePolicyExpiration || undefined;
      } else if (selectedAccessType === "Entrevista") {
        typeSpecificData.interviewDetails = {
          jobPositionApplied: jobPositionApplied.trim(),
          recruiterName: recruiterName.trim(),
          vacancyFolio: vacancyFolio.trim()
        };
      } else if (selectedAccessType === "Visita General") {
        typeSpecificData.generalDetails = {
          visitReason: visitReason.trim(),
          companionCount: Number(companionCount) || 0
        };
      }

      const newVisitorData: Omit<Visitor, "id"> = {
        fullName: fullName.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        idType,
        idNumber: idNumber.trim(),
        accessType: selectedAccessType,
        hostId: selectedHost ? selectedHost.id : "general",
        hostName: selectedHost ? selectedHost.fullName : "Recepción General",
        hostEmail: selectedHost ? selectedHost.email : "contacto@empresa.com",
        department,
        zone,
        scheduledDateTime: new Date(scheduledDateTime).toISOString(),
        vehiclePlates: vehiclePlates.trim() ? vehiclePlates.trim().toUpperCase() : undefined,
        equipmentRegistered: equipmentRegistered.trim(),
        healthDeclaration: noSymptoms && acceptSecurityPolicy,
        complianceRecord: complianceRecord || undefined,
        safetyInductionValidUntil: complianceRecord?.fecha_expiracion_induccion,
        status: "PENDING",
        qrFolio: folio,
        createdAt: now,
        updatedAt: now,
        isExternal: true,
        companions: validCompanions.length > 0 ? validCompanions : undefined,
        ...typeSpecificData
      };

      const docId = await addVisitor(newVisitorData);
      const fullVisitor: Visitor = { ...newVisitorData, id: docId };

      // Trigger Google No-Reply Email Notification in background (non-blocking)
      sendNoReplyEmailNotification("SOLICITUD", fullVisitor).catch((err) => {
        console.warn("Background notification notice:", err);
      });

      setCreatedVisitor(fullVisitor);
      setShowPassModal(true);

      // Reset state to Step 0
      setRegistrationStep(0);
      setFullName("");
      setCompany("");
      setEmail("");
      setEmailInput("");
      setPhone("");
      setIdNumber("");
      setWorkOrderPo("");
      setImssInsuranceNum("");
      setImssExpirationDate("");
      setAstPermitFolio("");
      setInvoiceOrWaybill("");
      setCargoType("");
      setTrailerPlates("");
      setMaterialsDescription("");
      setDriverLicenseNumber("");
      setInsurancePolicyNumber("");
      setInsurancePolicyExpiration("");
      setWaybillOrRemissionFolio("");
      setJobPositionApplied("");
      setRecruiterName("");
      setVacancyFolio("");
      setVisitReason("");
      setCompanionCount(0);
      setCompanionsList([]);
      setVehiclePlates("");
      setEquipmentRegistered("");
      setComplianceRecord(null);
      setMatchedProfileData(null);
    } catch (err) {
      console.error("Error saving visitor pre-registration:", err);
      alert("Ocurrió un error al registrar la cita. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategoryInfo = getCategoryInfo(selectedAccessType);
  const isComplianceActive = !!(complianceRecord && new Date(complianceRecord.fecha_expiracion_induccion) >= new Date());

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner & Tab Navigator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" /> Control de Acceso Industrial & EHS
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Portal de Pre-registro de Visitas</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Seleccione su perfil, valide sus documentos de seguridad y genere su Pase Digital con código QR.
              </p>
            </div>
            <div className="hidden sm:block bg-blue-600/30 p-3 rounded-2xl border border-blue-400/20">
              <QrCode className="w-10 h-10 text-blue-300" />
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === "register"
                  ? "border-blue-600 text-blue-600 bg-white shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Solicitar Nueva Cita</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lookup")}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === "lookup"
                  ? "border-blue-600 text-blue-600 bg-white shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consultar Estado de mi Cita</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: FORMULARIO DE REGISTRO CON STEPPER COMPLETO (PASO 0, 1 Y 2)        */}
          {/* ========================================================================= */}
          {activeTab === "register" && (
            <div>
              {/* Stepper Breadcrumb Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center space-x-2 text-slate-600">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      registrationStep === 0
                        ? "bg-blue-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {registrationStep > 0 ? "✓" : "0"}
                  </span>
                  <span className={registrationStep === 0 ? "text-blue-900 font-bold" : ""}>
                    Selección de Perfil
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      registrationStep === 1
                        ? "bg-blue-600 text-white"
                        : registrationStep > 1
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {registrationStep > 1 ? "✓" : "1"}
                  </span>
                  <span className={registrationStep === 1 ? "text-blue-900 font-bold" : ""}>
                    Verificación
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      registrationStep === 2
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    2
                  </span>
                  <span className={registrationStep === 2 ? "text-blue-900 font-bold" : ""}>
                    Datos y Requisitos
                  </span>
                </div>

                {registrationStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setRegistrationStep(0)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Cambiar Perfil
                  </button>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PASO 0: SELECCIÓN DE PERFIL Y EXPLICACIÓN PREVIA                      */}
              {/* --------------------------------------------------------------------- */}
              {registrationStep === 0 && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span>Seleccione su Perfil de Visitante</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Para garantizar la seguridad de la planta, cada perfil cuenta con requisitos y lineamientos documentales específicos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROFILE_CATEGORIES.map((cat) => {
                      const isSelected = selectedAccessType === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleSelectProfileCategory(cat.id)}
                          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between group hover:shadow-md ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-sm"
                              : "border-slate-200 hover:border-blue-300 bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800">
                                {cat.badge}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-300 group-hover:border-blue-400"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>

                            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-900">
                              {cat.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {cat.description}
                            </p>

                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Documentos / Requisitos Solicitados:
                              </p>
                              {cat.documentationRequirements.map((req, idx) => (
                                <p key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <span>{req}</span>
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            <span>Continuar con este Perfil</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PASO 1: SOLICITUD DE CORREO & PIN DE AUTOCOMPLETADO (ZERO KNOWLEDGE) */}
              {/* --------------------------------------------------------------------- */}
              {registrationStep === 1 && (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Selected profile summary banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Perfil Seleccionado
                      </span>
                      <h4 className="text-sm font-black text-blue-950">{currentCategoryInfo.title}</h4>
                      <p className="text-xs text-blue-800">{currentCategoryInfo.shortLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(0)}
                      className="bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs"
                    >
                      Cambiar
                    </button>
                  </div>

                  {!pinSent ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md mx-auto">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          Ingrese su Correo Electrónico
                        </h3>
                        <p className="text-xs text-slate-500">
                          Si ya se ha registrado anteriormente, le enviaremos un PIN de 4 dígitos para autocompletar sus datos con cero revelación pública.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="visitante@empresa.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none shadow-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isCheckingEmail}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        {isCheckingEmail ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verificando usuario...</span>
                          </>
                        ) : (
                          <>
                            <span>Continuar con mi Registro</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* PIN INPUT FOR RETURNING VISITOR (ZERO KNOWLEDGE) */
                    <form onSubmit={handleVerifyPinSubmit} className="space-y-4 max-w-md mx-auto">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <KeyRound className="w-6 h-6 animate-bounce" />
                        </div>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                          Visitante Registrado Detectado
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          Código de Seguridad de 4 Dígitos
                        </h3>
                        <p className="text-xs text-slate-500">
                          Hemos enviado un código a <strong className="text-slate-800">{emailInput}</strong> para autorizar la descarga de su información previa.
                        </p>
                      </div>

                      {devPinNotification && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-center justify-between">
                          <span className="font-mono font-bold">{devPinNotification}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const pinMatch = devPinNotification.match(/\b\d{4}\b/);
                              if (pinMatch) setPinInput(pinMatch[0]);
                            }}
                            className="bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-lg"
                          >
                            Autocompletar PIN
                          </button>
                        </div>
                      )}

                      {pinError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{pinError}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 text-center">
                          Ingrese el PIN de 4 Dígitos
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          autoFocus
                          placeholder="••••"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full text-center text-2xl tracking-[1em] font-mono py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none shadow-xs"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="submit"
                          disabled={pinInput.length !== 4}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Validar PIN y Cargar Mis Datos</span>
                        </button>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPinSent(false);
                              setPinInput("");
                            }}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            Reingresar correo
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              // Skip autofill, fill as blank
                              setEmail(emailInput);
                              setRegistrationStep(2);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Llenar formulario en blanco
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PASO 2: FORMULARIO PRINCIPAL CON DISCRIMINACIÓN DE VIGENCIAS          */}
              {/* --------------------------------------------------------------------- */}
              {registrationStep === 2 && (
                <div>
                  {/* Returning Visitor Notice */}
                  {matchedProfileData && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 text-xs text-emerald-950">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Visitante Validado:</strong> {fullName} ({company}). Datos fijos autocompletados.
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                        PIN Verificado ✓
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    {/* 1. DATOS FIJOS DEL VISITANTE (REUTILIZABLES) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" /> 1. Datos del Visitante
                        </span>
                        {matchedProfileData && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Identidad protegida y reutilizada)
                          </span>
                        )}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Juan Carlos Pérez"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Empresa / Procedencia *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Mantenimiento Industrial S.A."
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            required
                            readOnly={!!emailInput}
                            placeholder="visitante@empresa.com"
                            value={email || emailInput}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-all outline-none ${
                              emailInput
                                ? "bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed"
                                : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono Móvil *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="5512345678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tipo de Identificación *
                          </label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value as IdType)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          >
                            <option value="INE">INE / Credencial Electoral</option>
                            <option value="Licencia">Licencia de Conducir</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="Gafete">Gafete Corporativo</option>
                            <option value="Otro">Otro Documento Oficial</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Número / Folio de Identificación *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. ID-998811"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. REQUISITOS ESPECÍFICOS POR PERFIL Y CONTROL DE VIGENCIAS */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" /> 2. Requisitos de Perfil: {currentCategoryInfo.title}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          {currentCategoryInfo.badge}
                        </span>
                      </h3>

                      {/* CONTRATISTA / MANTENIMIENTO */}
                      {selectedAccessType === "Contratista" && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <HardHat className="w-4 h-4 text-blue-600" /> Seguridad Industrial & IMSS Mensual
                          </p>

                          {/* IMSS (Vigencia Mensual) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Número de Seguro Social IMSS *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. 192837465"
                                value={imssInsuranceNum}
                                onChange={(e) => setImssInsuranceNum(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                                <span>Vigencia de Alta / Pago IMSS *</span>
                                {imssExpirationDate && new Date(imssExpirationDate) >= new Date() ? (
                                  <span className="text-[10px] text-emerald-600 font-bold">Vigente ✓</span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 font-bold">Exigir Nuevo Mes</span>
                                )}
                              </label>
                              <input
                                type="date"
                                required
                                value={imssExpirationDate}
                                onChange={(e) => setImssExpirationDate(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>
                          </div>

                          {/* AST / Permiso Obligatorio por CITA */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Folio AST / Permiso de Trabajo de Alto Riesgo *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. AST-2026-ALTURAS-01"
                                value={astPermitFolio}
                                onChange={(e) => setAstPermitFolio(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Obligatorio por cada cita / trabajo en sitio
                              </span>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Orden de Trabajo / PO
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. OT-2026-88"
                                value={workOrderPo}
                                onChange={(e) => setWorkOrderPo(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>
                          </div>

                          {/* Cumplimiento Normativo STPS / IMSS Adicional */}
                          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Comprobante Pago IMSS / Folio SUA
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. SUA-EMIS-2026-08 / Folio Bancario"
                                value={suaPaymentProof}
                                onChange={(e) => setSuaPaymentProof(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Constancia Habilidades DC-3 (STPS)
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. DC3-ALTURAS-2026 / DC3-SOLDADURA"
                                value={dc3Certification}
                                onChange={(e) => setDc3Certification(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Folio Examen Antidoping Vigente
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. LAB-ANTI-2026-NEG / Folio Laboratorio"
                                value={antidopingCertificate}
                                onChange={(e) => setAntidopingCertificate(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Plan de Trabajo / Descripción
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. Reparación tubería línea 2 / Mantenimiento HVAC"
                                value={workPlanDescription}
                                onChange={(e) => setWorkPlanDescription(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 pt-1 text-xs">
                            <label className="flex items-center space-x-2 font-semibold text-slate-800">
                              <input
                                type="checkbox"
                                checked={hasEpp}
                                onChange={(e) => setHasEpp(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>Cuento con EPP completo (Casco, Botas NOM, Lentes, Chaleco)</span>
                            </label>

                            <label className="flex items-center space-x-2 font-semibold text-slate-800">
                              <input
                                type="checkbox"
                                checked={highRiskPermit}
                                onChange={(e) => setHighRiskPermit(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>Trabajo de Alto Riesgo</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* PROVEEDOR / COMERCIAL */}
                      {selectedAccessType === "Proveedor" && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-blue-600" /> Facturación, Carga y Acuerdo NDA
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                No. Remisión / Factura *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. REM-5521"
                                value={invoiceOrWaybill}
                                onChange={(e) => setInvoiceOrWaybill(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Tipo de Carga</label>
                              <input
                                type="text"
                                placeholder="Ej. Materia Prima / Empaque"
                                value={cargoType}
                                onChange={(e) => setCargoType(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Placas de Caja / Remolque</label>
                              <input
                                type="text"
                                placeholder="Ej. 88-XX-12"
                                value={trailerPlates}
                                onChange={(e) => setTrailerPlates(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TRANSPORTISTA / LOGÍSTICA */}
                      {selectedAccessType === "Transportista" && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-blue-600" /> Logística, Póliza de Seguro y Carta Porte
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Licencia de Conducir Transporte *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. LIC-FED-998811"
                                value={driverLicenseNumber}
                                onChange={(e) => setDriverLicenseNumber(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                Carta Porte / Folio de Remisión *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. CP-2026-EMB-88"
                                value={waybillOrRemissionFolio}
                                onChange={(e) => setWaybillOrRemissionFolio(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Obligatorio por cada embarque / viaje
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">
                                No. Póliza de Seguro Vehicular *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. POL-QUALITAS-8899"
                                value={insurancePolicyNumber}
                                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                                <span>Vencimiento de Póliza *</span>
                                {insurancePolicyExpiration && new Date(insurancePolicyExpiration) >= new Date() ? (
                                  <span className="text-[10px] text-emerald-600 font-bold">Vigente ✓</span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 font-bold">Póliza Actual</span>
                                )}
                              </label>
                              <input
                                type="date"
                                required
                                value={insurancePolicyExpiration}
                                onChange={(e) => setInsurancePolicyExpiration(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CANDIDATO / ENTREVISTA */}
                      {selectedAccessType === "Entrevista" && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" /> Proceso de Selección y Reclutamiento
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Puesto Solicitado *</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Supervisor de Calidad"
                                value={jobPositionApplied}
                                onChange={(e) => setJobPositionApplied(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Nombre de Reclutador / RH</label>
                              <input
                                type="text"
                                placeholder="Ej. Lic. Mariana Gómez"
                                value={recruiterName}
                                onChange={(e) => setRecruiterName(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VISITA GENERAL */}
                      {selectedAccessType === "Visita General" && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Motivo Específico *</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Reunión Comercial / Auditoría"
                                value={visitReason}
                                onChange={(e) => setVisitReason(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1">Número de Acompañantes</label>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={companionCount}
                                onChange={(e) => handleCompanionCountChange(Number(e.target.value))}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                              />
                            </div>
                          </div>

                          {companionCount > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                              <p className="text-[11px] font-bold text-slate-700">
                                Registro de Acompañantes ({companionsList.length}):
                              </p>
                              {companionsList.map((comp, idx) => (
                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                                  <input
                                    type="text"
                                    placeholder={`Nombre Acompañante ${idx + 1}`}
                                    value={comp.fullName}
                                    onChange={(e) => handleCompanionFieldChange(idx, "fullName", e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-xs"
                                  />
                                  <input
                                    type="text"
                                    placeholder="INE / Pasaporte"
                                    value={comp.idNumber}
                                    onChange={(e) => handleCompanionFieldChange(idx, "idNumber", e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-xs"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Empresa"
                                    value={comp.company}
                                    onChange={(e) => handleCompanionFieldChange(idx, "company", e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. MÓDULO DE REGLAMENTO / EHS COMPLIANCE STATUS */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Reglamento Oficial: {currentCategoryInfo.ruleBookTitle}
                          </span>
                        </div>

                        {isComplianceActive ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Inducción Vigente ✓
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Lectura & Firma Requerida
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        {isComplianceActive
                          ? `Constancia registrada el ${formatSpanishDate(complianceRecord?.fecha_aceptacion || '')}. Documento: ${complianceRecord?.version_doc}. Omisión automática por vigencia activa.`
                          : `Para ingresar a las instalaciones, es obligatorio leer el documento con scroll completo y registrar su conformidad electrónica.`}
                      </p>

                      {!isComplianceActive && (
                        <button
                          type="button"
                          onClick={() => setShowComplianceModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Abrir y Firmar Reglamento / Inducción EHS</span>
                        </button>
                      )}
                    </div>

                    {/* 4. ANFITRIÓN Y FECHA PROGRAMADA */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Building2 className="w-4 h-4 text-blue-600" /> 3. Anfitrión y Programación
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Anfitrión / Contacto en Planta *
                          </label>
                          <select
                            value={selectedHostId}
                            onChange={(e) => handleHostChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-medium"
                          >
                            {hosts.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.fullName} — {h.department}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha y Hora Estimada *
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-slate-400" /> Placas de Vehículo (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. ABC-123-D"
                            value={vehiclePlates}
                            onChange={(e) => setVehiclePlates(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Equipo o Herramientas a Ingresar
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Laptop Dell S/N 8891, Rotomartillo"
                            value={equipmentRegistered}
                            onChange={(e) => setEquipmentRegistered(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Declaration */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="flex items-center space-x-2 font-semibold text-slate-800 text-xs">
                        <input
                          type="checkbox"
                          checked={acceptSecurityPolicy}
                          onChange={(e) => setAcceptSecurityPolicy(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>
                          Declaro bajo protesta de decir verdad que los datos proporcionados son fidedignos y me comprometo a respetar las políticas de seguridad.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Registrando cita en Firestore...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Generar Pase Digital y Notificar a Anfitrión</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CONSULTAR ESTADO DE MI CITA (BUSCADOR FOLIO / CORREO)               */}
          {/* ========================================================================= */}
          {activeTab === "lookup" && (
            <div className="p-6 sm:p-8 space-y-6">
              <form onSubmit={handleLookupStatus} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ingrese su Folio QR, Correo Electrónico o Teléfono
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ej. FOL-2026-X892, o su correo"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Search Result Display */}
              {hasSearched && (
                <div>
                  {searchResult ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            FOLIO: {searchResult.qrFolio}
                          </span>
                          <h4 className="text-base font-bold text-slate-900">{searchResult.fullName}</h4>
                          <p className="text-xs text-slate-500">{searchResult.company}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          {searchResult.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> APROBADA
                            </span>
                          )}
                          {searchResult.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDIENTE
                            </span>
                          )}
                          {searchResult.status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> NO APROBADA
                            </span>
                          )}
                          {searchResult.status === "CANCELLED" && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-600" /> CANCELADA
                            </span>
                          )}
                          {searchResult.status === "CHECKED_IN" && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" /> EN PLANTA
                            </span>
                          )}
                          {searchResult.status === "CHECKED_OUT" && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> SALIDA COMPLETADA
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg">
                        <div>
                          <span className="text-slate-400 font-semibold block">Anfitrión:</span>
                          <span className="font-bold">{searchResult.hostName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Departamento:</span>
                          <span className="font-bold">{searchResult.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Fecha Cita:</span>
                          <span className="font-bold">{formatSpanishDate(searchResult.scheduledDateTime)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Tipo de Visita:</span>
                          <span className="font-bold">{searchResult.accessType}</span>
                        </div>
                      </div>

                      {searchResult.status === "REJECTED" && searchResult.rejectionReason && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                          <strong>Motivo de Rechazo:</strong> {searchResult.rejectionReason}
                        </div>
                      )}

                      {(searchResult.status === "APPROVED" || searchResult.status === "CHECKED_IN") && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCreatedVisitor(searchResult);
                              setShowPassModal(true);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Ver mi Pase Digital con Código QR</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-bold">No se encontró ningún registro con ese Folio o Correo.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Verifique que la información sea correcta o solicite una nueva cita en la pestaña anterior.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success Banner */}
        {createdVisitor && !showPassModal && (
          <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Cita Pre-registrada Exitosamente</h4>
                <p className="text-xs text-emerald-700">Folio QR: {createdVisitor.qrFolio}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPassModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors"
            >
              Ver Pase Digital
            </button>
          </div>
        )}
      </div>

      {/* Regulation Compliance & EHS Scroll Modal */}
      {showComplianceModal && (
        <RegulationComplianceModal
          accessType={selectedAccessType}
          visitorEmail={email || emailInput}
          visitorName={fullName}
          onAccept={(record) => {
            setComplianceRecord(record);
            setShowComplianceModal(false);
          }}
          onClose={() => setShowComplianceModal(false)}
        />
      )}

      {/* Digital Pass Modal */}
      {showPassModal && createdVisitor && (
        <DigitalPassModal
          visitor={createdVisitor}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </div>
  );
};
