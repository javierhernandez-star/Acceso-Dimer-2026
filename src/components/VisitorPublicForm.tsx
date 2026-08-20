import React, { useState, useEffect } from "react";
import { Visitor, Host, AccessType, IdType, VisitorProfile } from "../types";
import { addVisitor, subscribeHosts, subscribeVisitors, subscribeVisitorProfiles } from "../lib/firebase";
import { sendNoReplyEmailNotification } from "../lib/notifications";
import { generateQRFolio, formatSpanishDate, getCleanPublicVisitorUrl } from "../lib/utils";
import { DigitalPassModal } from "./DigitalPassModal";
import {
  Building2, User, Mail, Phone, Shield, FileText, Calendar, Car, CheckSquare,
  Send, CheckCircle2, QrCode, Search, Sparkles, HardHat, Truck, AlertCircle, Clock, XCircle
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

  // Form State
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<IdType>("INE");
  const [idNumber, setIdNumber] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("Visita General");
  const [selectedHostId, setSelectedHostId] = useState(preselectedHostId || "");
  const [department, setDepartment] = useState("Oficinas / Gerencia");
  const [zone, setZone] = useState("Edificio Administrativo - Oficinas");

  // Dynamic fields
  // Contratista
  const [workOrderPo, setWorkOrderPo] = useState("");
  const [imssInsuranceNum, setImssInsuranceNum] = useState("");
  const [hasEpp, setHasEpp] = useState(true);
  const [highRiskPermit, setHighRiskPermit] = useState(false);
  const [highRiskType, setHighRiskType] = useState("Trabajos en Alturas");

  // Proveedor
  const [invoiceOrWaybill, setInvoiceOrWaybill] = useState("");
  const [cargoType, setCargoType] = useState("Insumos de Producción");
  const [trailerPlates, setTrailerPlates] = useState("");
  const [materialsDescription, setMaterialsDescription] = useState("");

  // Entrevista
  const [jobPositionApplied, setJobPositionApplied] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [vacancyFolio, setVacancyFolio] = useState("");

  // General
  const [visitReason, setVisitReason] = useState("");
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [companionsList, setCompanionsList] = useState<{ fullName: string; idNumber: string; company: string }[]>([]);

  // Format datetime-local default to tomorrow at 10:00 AM
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(10, 0, 0, 0);
  const defaultDateStr = defaultDate.toISOString().slice(0, 16);

  const [scheduledDateTime, setScheduledDateTime] = useState(defaultDateStr);
  const [vehiclePlates, setVehiclePlates] = useState("");
  const [equipmentRegistered, setEquipmentRegistered] = useState("");

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

  // Health declaration checkboxes
  const [noSymptoms, setNoSymptoms] = useState(true);
  const [acceptSecurityPolicy, setAcceptSecurityPolicy] = useState(true);

  // Auto-fill match & Quick Search for returning visitors
  const [matchedVisitor, setMatchedVisitor] = useState<Visitor | VisitorProfile | null>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [frequentSearchResults, setFrequentSearchResults] = useState<Array<Visitor | VisitorProfile>>([]);
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);

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

  // Handle Quick Search for frequent visitors across both Visitor Profiles and past Visitor appointments
  const handleQuickSearch = (query: string) => {
    setQuickSearchQuery(query);
    setAutoFillSuccessMessage(null);
    const q = query.trim().toLowerCase();
    // Safe threshold: require at least 5 characters for prediction
    if (!q || q.length < 5) {
      setFrequentSearchResults([]);
      return;
    }

    const cleanQ = q.replace(/[^a-z0-9]/gi, "");

    const matches: Array<Visitor | VisitorProfile> = [];

    // Search in persistent visitor profiles first
    allProfiles.forEach((p) => {
      const pId = (p.idNumber || "").toLowerCase();
      const pCleanId = pId.replace(/[^a-z0-9]/gi, "");
      const pPhone = (p.phone || "").toLowerCase();
      const pCleanPhone = pPhone.replace(/[^a-z0-9]/gi, "");
      const pName = (p.fullName || "").toLowerCase();
      const pCompany = (p.company || "").toLowerCase();
      const pEmail = (p.email || "").toLowerCase();

      if (
        (pId && pId.includes(q)) ||
        (cleanQ && cleanQ.length >= 5 && pCleanId && pCleanId.includes(cleanQ)) ||
        (pPhone && pPhone.includes(q)) ||
        (cleanQ && cleanQ.length >= 6 && pCleanPhone && pCleanPhone.includes(cleanQ)) ||
        (pName && pName.includes(q)) ||
        (pCompany && pCompany.includes(q)) ||
        (pEmail && pEmail.includes(q))
      ) {
        matches.push(p);
      }
    });

    // Also search in past visitor appointments
    allVisitors.forEach((v) => {
      const vId = (v.idNumber || "").toLowerCase();
      const vCleanId = vId.replace(/[^a-z0-9]/gi, "");
      const vPhone = (v.phone || "").toLowerCase();
      const vCleanPhone = vPhone.replace(/[^a-z0-9]/gi, "");
      const vName = (v.fullName || "").toLowerCase();
      const vCompany = (v.company || "").toLowerCase();
      const vEmail = (v.email || "").toLowerCase();
      const vFolio = (v.qrFolio || "").toLowerCase();

      if (
        (vId && vId.includes(q)) ||
        (cleanQ && cleanQ.length >= 5 && vCleanId && vCleanId.includes(cleanQ)) ||
        (vPhone && vPhone.includes(q)) ||
        (cleanQ && cleanQ.length >= 6 && vCleanPhone && vCleanPhone.includes(cleanQ)) ||
        (vName && vName.includes(q)) ||
        (vCompany && vCompany.includes(q)) ||
        (vEmail && vEmail.includes(q)) ||
        (vFolio && vFolio.includes(q))
      ) {
        matches.push(v);
      }
    });

    // Deduplicate by ID number or Email or Full Name
    const uniqueMap = new Map<string, Visitor | VisitorProfile>();
    matches.forEach((item) => {
      const key = ((item.idNumber && item.idNumber !== "S/N" ? item.idNumber : "") || item.email || item.phone || item.fullName).trim().toLowerCase();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    setFrequentSearchResults(Array.from(uniqueMap.values()).slice(0, 6));
  };

  // Populate form with all fields from selected visitor record or profile
  const populateFromVisitor = (v: Visitor | VisitorProfile) => {
    setFullName(v.fullName || "");
    setCompany(v.company || "");
    setEmail(v.email || "");
    setPhone(v.phone || "");
    setIdType(v.idType || "INE");
    setIdNumber(v.idNumber || "");
    if (v.vehiclePlates) setVehiclePlates(v.vehiclePlates);
    if (v.accessType) setAccessType(v.accessType);

    // If it's a full Visitor instance with specific module details
    const vis = v as Visitor;
    if (vis.equipmentRegistered) setEquipmentRegistered(vis.equipmentRegistered);

    if (vis.contractorDetails) {
      if (vis.contractorDetails.workOrderPo) setWorkOrderPo(vis.contractorDetails.workOrderPo);
      if (vis.contractorDetails.imssInsuranceNum) setImssInsuranceNum(vis.contractorDetails.imssInsuranceNum);
      if (vis.contractorDetails.hasEpp !== undefined) setHasEpp(vis.contractorDetails.hasEpp);
      if (vis.contractorDetails.highRiskPermit !== undefined) setHighRiskPermit(vis.contractorDetails.highRiskPermit);
      if (vis.contractorDetails.highRiskType) setHighRiskType(vis.contractorDetails.highRiskType);
    }

    if (vis.supplierDetails) {
      if (vis.supplierDetails.invoiceOrWaybill) setInvoiceOrWaybill(vis.supplierDetails.invoiceOrWaybill);
      if (vis.supplierDetails.cargoType) setCargoType(vis.supplierDetails.cargoType);
      if (vis.supplierDetails.trailerPlates) setTrailerPlates(vis.supplierDetails.trailerPlates);
      if (vis.supplierDetails.materialsDescription) setMaterialsDescription(vis.supplierDetails.materialsDescription);
    }

    if (vis.interviewDetails) {
      if (vis.interviewDetails.jobPositionApplied) setJobPositionApplied(vis.interviewDetails.jobPositionApplied);
      if (vis.interviewDetails.recruiterName) setRecruiterName(vis.interviewDetails.recruiterName);
      if (vis.interviewDetails.vacancyFolio) setVacancyFolio(vis.interviewDetails.vacancyFolio);
    }

    if (vis.generalDetails) {
      if (vis.generalDetails.visitReason) setVisitReason(vis.generalDetails.visitReason);
      if (vis.generalDetails.companionCount !== undefined) setCompanionCount(vis.generalDetails.companionCount);
    }

    setMatchedVisitor(null);
    setQuickSearchQuery("");
    setFrequentSearchResults([]);
    setAutoFillSuccessMessage(`¡Datos de ${v.fullName} (${v.company}) cargados exitosamente!`);
  };

  // Match previous visitor or profile by ID, Phone, or Name when typing in form (safe threshold >= 5 or 6 characters)
  useEffect(() => {
    const termId = idNumber.trim().toLowerCase();
    const termPhone = phone.trim().toLowerCase();
    const termName = fullName.trim().toLowerCase();
    const cleanTermId = termId.replace(/[^a-z0-9]/gi, "");
    const cleanTermPhone = termPhone.replace(/[^a-z0-9]/gi, "");

    const hasValidIdTerm = cleanTermId.length >= 5;
    const hasValidPhoneTerm = cleanTermPhone.length >= 6;
    const hasValidNameTerm = termName.length >= 6;

    if (hasValidIdTerm || hasValidPhoneTerm || hasValidNameTerm) {
      // Check profiles first
      const matchProfile = allProfiles.find((p) => {
        const pId = (p.idNumber || "").toLowerCase();
        const pCleanId = pId.replace(/[^a-z0-9]/gi, "");
        const pPhone = (p.phone || "").toLowerCase();
        const pCleanPhone = pPhone.replace(/[^a-z0-9]/gi, "");

        if (hasValidIdTerm && pCleanId && (pCleanId === cleanTermId || pCleanId.includes(cleanTermId))) return true;
        if (hasValidPhoneTerm && pCleanPhone && (pCleanPhone === cleanTermPhone || pCleanPhone.includes(cleanTermPhone))) return true;
        if (hasValidNameTerm && p.fullName.toLowerCase() === termName) return true;
        return false;
      });

      if (matchProfile) {
        setMatchedVisitor(matchProfile);
        return;
      }

      // Check all visitors
      const matchVisitor = allVisitors.find((v) => {
        const vId = (v.idNumber || "").toLowerCase();
        const vCleanId = vId.replace(/[^a-z0-9]/gi, "");
        const vPhone = (v.phone || "").toLowerCase();
        const vCleanPhone = vPhone.replace(/[^a-z0-9]/gi, "");

        if (hasValidIdTerm && vCleanId && (vCleanId === cleanTermId || vCleanId.includes(cleanTermId))) return true;
        if (hasValidPhoneTerm && vCleanPhone && (vCleanPhone === cleanTermPhone || vCleanPhone.includes(cleanTermPhone))) return true;
        if (hasValidNameTerm && v.fullName.toLowerCase() === termName) return true;
        return false;
      });

      setMatchedVisitor(matchVisitor || null);
    } else {
      setMatchedVisitor(null);
    }
  }, [idNumber, phone, fullName, allVisitors, allProfiles]);

  const handleHostChange = (hostId: string) => {
    setSelectedHostId(hostId);
    const host = hosts.find((h) => h.id === hostId);
    if (host) {
      setDepartment(host.department);
    }
  };

  // Search visitor appointment by QR Folio, Email, or Phone
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !company || !email || !phone || !idNumber) {
      alert("Por favor complete todos los campos obligatorios (*).");
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
      if (accessType === "Contratista") {
        typeSpecificData.contractorDetails = {
          workOrderPo: workOrderPo.trim(),
          imssInsuranceNum: imssInsuranceNum.trim(),
          hasEpp,
          highRiskPermit,
          highRiskType: highRiskPermit ? highRiskType : ""
        };
      } else if (accessType === "Proveedor") {
        typeSpecificData.supplierDetails = {
          invoiceOrWaybill: invoiceOrWaybill.trim(),
          cargoType: cargoType.trim(),
          trailerPlates: trailerPlates.trim().toUpperCase(),
          materialsDescription: materialsDescription.trim()
        };
      } else if (accessType === "Entrevista") {
        typeSpecificData.interviewDetails = {
          jobPositionApplied: jobPositionApplied.trim(),
          recruiterName: recruiterName.trim(),
          vacancyFolio: vacancyFolio.trim()
        };
      } else if (accessType === "Visita General") {
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
        accessType,
        hostId: selectedHost ? selectedHost.id : "general",
        hostName: selectedHost ? selectedHost.fullName : "Recepción General",
        hostEmail: selectedHost ? selectedHost.email : "contacto@empresa.com",
        department,
        zone,
        scheduledDateTime: new Date(scheduledDateTime).toISOString(),
        vehiclePlates: vehiclePlates.trim() ? vehiclePlates.trim().toUpperCase() : undefined,
        equipmentRegistered: equipmentRegistered.trim(),
        healthDeclaration: noSymptoms && acceptSecurityPolicy,
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
      sendNoReplyEmailNotification('SOLICITUD', fullVisitor).catch((err) => {
        console.warn("Background notification notice:", err);
      });

      setCreatedVisitor(fullVisitor);
      setShowPassModal(true);
      
      // Reset form state for next registration
      setFullName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setIdNumber("");
      setWorkOrderPo("");
      setImssInsuranceNum("");
      setInvoiceOrWaybill("");
      setCargoType("");
      setTrailerPlates("");
      setMaterialsDescription("");
      setJobPositionApplied("");
      setRecruiterName("");
      setVacancyFolio("");
      setVisitReason("");
      setCompanionCount(0);
      setCompanionsList([]);
      setVehiclePlates("");
      setEquipmentRegistered("");
    } catch (err) {
      console.error("Error saving visitor pre-registration:", err);
      alert("Ocurrió un error al registrar la cita. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Banner & Tab Navigator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" /> Control de Acceso Industrial
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Portal de Pre-registro de Visitas</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Pre-registre su cita o consulte el estado actual de su Pase Digital con código QR.
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

          {/* TAB 1: FORMULARIO DE REGISTRO */}
          {activeTab === "register" && (
            <div>
              {/* Quick Returning Visitor Search Bar */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-4 border-b border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>¿Ya se ha registrado anteriormente en la planta?</span>
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Auto-llenado Rápido
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por ID / INE, Teléfono, Correo, Folio o Nombre..."
                    value={quickSearchQuery}
                    onChange={(e) => handleQuickSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none shadow-xs"
                  />
                  <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                </div>

                {/* Quick Search Results Dropdown */}
                {frequentSearchResults.length > 0 && (
                  <div className="bg-white border border-indigo-200 rounded-xl shadow-lg p-2 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
                      Visitantes Registrados Encontrados ({frequentSearchResults.length}):
                    </p>
                    {frequentSearchResults.map((fv) => (
                      <div
                        key={fv.id}
                        className="flex items-center justify-between p-2.5 hover:bg-indigo-50/70 rounded-lg transition-colors border border-slate-100"
                      >
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-900">{fv.fullName} <span className="font-semibold text-slate-500">({fv.company})</span></p>
                          <p className="text-[11px] text-slate-500">
                            ID/INE: <span className="font-mono text-slate-700 font-bold">{fv.idNumber}</span> • Tel: {fv.phone} • Email: {fv.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => populateFromVisitor(fv)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap"
                        >
                          ⚡ Cargar Datos
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {autoFillSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-2.5 rounded-xl flex items-center justify-between">
                    <span>{autoFillSuccessMessage}</span>
                    <button
                      type="button"
                      onClick={() => setAutoFillSuccessMessage(null)}
                      className="text-emerald-600 hover:text-emerald-900 text-xs font-black"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {matchedVisitor && !autoFillSuccessMessage && (
                <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                    <span>
                      <strong>Coincidencia por ID/Teléfono:</strong> {matchedVisitor.fullName} ({matchedVisitor.company})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => populateFromVisitor(matchedVisitor)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap"
                  >
                    ⚡ Cargar Mis Datos
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                {/* 1. Datos del Visitante */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-blue-600" /> 1. Datos del Visitante
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
                        placeholder="visitante@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
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

                {/* 2. Tipo de Visitante & Requisitos */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Building2 className="w-4 h-4 text-indigo-600" /> 2. Clasificación de Visitante
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Seleccione Tipo de Cita *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "Visita General", label: "General", icon: User },
                        { id: "Contratista", label: "Contratista", icon: HardHat },
                        { id: "Proveedor", label: "Proveedor", icon: Truck },
                        { id: "Entrevista", label: "Entrevista", icon: FileText }
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const selected = accessType === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setAccessType(item.id as AccessType)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1 ${
                              selected
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Fields for CONTRATISTA */}
                  {accessType === "Contratista" && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-blue-600" /> Datos de Seguridad de Contratista
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Orden de Trabajo / PO</label>
                          <input
                            type="text"
                            placeholder="Ej. OT-2026-88"
                            value={workOrderPo}
                            onChange={(e) => setWorkOrderPo(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Seguro IMSS / Póliza</label>
                          <input
                            type="text"
                            placeholder="Ej. 192837465"
                            value={imssInsuranceNum}
                            onChange={(e) => setImssInsuranceNum(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
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
                          <span>Cuento con EPP completo (Casco, Botas, Chaleco)</span>
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

                  {/* Dynamic Fields for PROVEEDOR */}
                  {accessType === "Proveedor" && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-600" /> Información de Carga y Facturación
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">No. Remisión / Factura</label>
                          <input
                            type="text"
                            placeholder="Ej. REM-5521"
                            value={invoiceOrWaybill}
                            onChange={(e) => setInvoiceOrWaybill(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Tipo de Carga</label>
                          <input
                            type="text"
                            placeholder="Ej. Materia Prima / Empaque"
                            value={cargoType}
                            onChange={(e) => setCargoType(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Placas de Caja / Remolque</label>
                          <input
                            type="text"
                            placeholder="Ej. 88-XX-12"
                            value={trailerPlates}
                            onChange={(e) => setTrailerPlates(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for VISITA GENERAL */}
                  {accessType === "Visita General" && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Motivo Específico de la Visita</label>
                          <input
                            type="text"
                            placeholder="Ej. Reunión Comercial / Auditoría"
                            value={visitReason}
                            onChange={(e) => setVisitReason(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
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
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Companion List Structured Inputs */}
                      {companionCount > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          <p className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                            <span>👥 Registro de Acompañantes ({companionsList.length}):</span>
                            <span className="text-[10px] text-slate-500 font-normal">Complete el nombre e identificación de cada uno</span>
                          </p>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {companionsList.map((comp, idx) => (
                              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                                  Acompañante #{idx + 1}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                  <input
                                    type="text"
                                    placeholder="Nombre completo *"
                                    value={comp.fullName}
                                    onChange={(e) => handleCompanionFieldChange(idx, "fullName", e.target.value)}
                                    className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    placeholder="No. Identificación / INE"
                                    value={comp.idNumber}
                                    onChange={(e) => handleCompanionFieldChange(idx, "idNumber", e.target.value)}
                                    className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Empresa (Si difiere)"
                                    value={comp.company}
                                    onChange={(e) => handleCompanionFieldChange(idx, "company", e.target.value)}
                                    className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Programación y Anfitrión */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> 3. Programación y Anfitrión
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Anfitrión / Empleado a Visitar *
                      </label>
                      <select
                        value={selectedHostId}
                        onChange={(e) => handleHostChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-medium"
                      >
                        {hosts.map((host) => (
                          <option key={host.id} value={host.id}>
                            {host.fullName} — ({host.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Zona de Destino *
                      </label>
                      <select
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                      >
                        <option value="Edificio Administrativo - Oficinas">Edificio Administrativo - Oficinas</option>
                        <option value="Almacén Central / Recepción">Almacén Central / Recepción</option>
                        <option value="Nave de Producción Principal">Nave de Producción Principal</option>

                        <option value="Taller de Mantenimiento">Taller de Mantenimiento</option>
                        <option value="Laboratorio y Control de Calidad">Laboratorio y Control de Calidad</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha y Hora Propuesta *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" /> Placas de Vehículo (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. ABC-123"
                        value={vehiclePlates}
                        onChange={(e) => setVehiclePlates(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Declaración de Salud y Seguridad */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Shield className="w-4 h-4 text-emerald-600" /> 4. Declaración y Protocolo de Seguridad
                  </h3>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noSymptoms}
                        onChange={(e) => setNoSymptoms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs text-slate-700">
                        Declaro no presentar síntomas respiratorios o de contagio.
                      </span>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptSecurityPolicy}
                        onChange={(e) => setAcceptSecurityPolicy(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs text-slate-700">
                        Acepto acatar el protocolo de seguridad industrial de la planta.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Registrando cita en Firestore...</span>
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

          {/* TAB 2: CONSULTAR ESTADO DE MI CITA */}
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

                      {searchResult.status === "CANCELLED" && searchResult.cancellationReason && (
                        <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-900">
                          <strong>Motivo de Cancelación:</strong> {searchResult.cancellationReason}
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
