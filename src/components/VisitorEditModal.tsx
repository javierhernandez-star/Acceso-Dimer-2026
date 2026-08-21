import React, { useState, useEffect } from "react";
import { Visitor, Host, AccessType, IdType, VisitorStatus, VisitorProfile } from "../types";
import { updateVisitor, addVisitor, getAvailableBadgeNumber, getSequentialAvailableBadges, subscribeVisitorProfiles } from "../lib/firebase";
import { sendNoReplyEmailNotification } from "../lib/notifications";
import { generateQRFolio, formatSpanishDate } from "../lib/utils";
import { DigitalPassModal } from "./DigitalPassModal";
import {
  X, User, Building2, Mail, Phone, ShieldCheck, QrCode, Calendar, Clock,
  Car, HardHat, Truck, FileText, CheckCircle2, AlertCircle, Sparkles, Hash, Laptop, Search,
  Check, ExternalLink, RefreshCw
} from "lucide-react";

interface VisitorEditModalProps {
  visitor?: Visitor | null;
  allVisitors: Visitor[];
  hosts: Host[];
  onClose: () => void;
  performedBy?: string;
  actorName?: string;
}

export const VisitorEditModal: React.FC<VisitorEditModalProps> = ({
  visitor,
  allVisitors,
  hosts,
  onClose,
  performedBy,
  actorName
}) => {
  const isEditing = !!visitor;
  const effectiveActor = actorName || performedBy || "Administrador";

  // Immutability flags
  const isFinalizedRecord = isEditing && visitor && (visitor.status === "REJECTED" || visitor.status === "CANCELLED");
  const isApprovedRecord = isEditing && visitor && (visitor.status === "APPROVED" || visitor.status === "CHECKED_IN" || visitor.status === "CHECKED_OUT");
  const isCoreLocked = isFinalizedRecord || isApprovedRecord;

  // Basic Info
  const [fullName, setFullName] = useState(visitor?.fullName || "");
  const [company, setCompany] = useState(visitor?.company || "");
  const [companyRfc, setCompanyRfc] = useState(visitor?.companyRfc || "");
  const [email, setEmail] = useState(visitor?.email || "");
  const [phone, setPhone] = useState(visitor?.phone || "");
  const [idType, setIdType] = useState<IdType>(visitor?.idType || "INE");
  const [idNumber, setIdNumber] = useState(visitor?.idNumber || "");

  // Emergency & Medical Info
  const [emergencyContactName, setEmergencyContactName] = useState(visitor?.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(visitor?.emergencyContactPhone || "");
  const [bloodType, setBloodType] = useState(visitor?.bloodType || "");
  const [allergies, setAllergies] = useState(visitor?.allergies || "");

  // Access & Host Info
  const [accessType, setAccessType] = useState<AccessType>(visitor?.accessType || "Visita General");
  const [selectedHostId, setSelectedHostId] = useState(
    visitor?.hostId || (hosts[0]?.id || "")
  );
  const [zone, setZone] = useState(visitor?.zone || "Planta Principal");
  const [scheduledDateTime, setScheduledDateTime] = useState(
    visitor?.scheduledDateTime
      ? new Date(visitor.scheduledDateTime).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [vehiclePlates, setVehiclePlates] = useState(visitor?.vehiclePlates || "");
  const [vehicleModel, setVehicleModel] = useState(visitor?.vehicleModel || "");
  const [vehicleColor, setVehicleColor] = useState(visitor?.vehicleColor || "");
  const [equipmentRegistered, setEquipmentRegistered] = useState(visitor?.equipmentRegistered || "");
  const [status, setStatus] = useState<VisitorStatus>(visitor?.status || "PENDING");
  const [badgeNumber, setBadgeNumber] = useState(visitor?.badgeNumber || "");
  const [rejectionReason, setRejectionReason] = useState(visitor?.rejectionReason || "");
  const [cancellationReason, setCancellationReason] = useState(visitor?.cancellationReason || "");

  // Type Specific Fields
  // Contratista
  const [workOrderPo, setWorkOrderPo] = useState(visitor?.contractorDetails?.workOrderPo || "");
  const [imssInsuranceNum, setImssInsuranceNum] = useState(visitor?.contractorDetails?.imssInsuranceNum || visitor?.imssNumber || "");
  const [imssExpirationDate, setImssExpirationDate] = useState(visitor?.contractorDetails?.imssExpirationDate || visitor?.imssExpirationDate || "");
  const [suaPaymentProof, setSuaPaymentProof] = useState(visitor?.contractorDetails?.suaPaymentProof || visitor?.suaPaymentProof || "");
  const [dc3Certification, setDc3Certification] = useState(visitor?.contractorDetails?.dc3Certification || visitor?.dc3Certification || "");
  const [antidopingCertificate, setAntidopingCertificate] = useState(visitor?.contractorDetails?.antidopingCertificate || visitor?.antidopingCertificate || "");
  const [workPlanDescription, setWorkPlanDescription] = useState(visitor?.contractorDetails?.workPlanDescription || visitor?.workPlanDescription || "");
  const [astPermitFolio, setAstPermitFolio] = useState(visitor?.contractorDetails?.astPermitFolio || "");
  const [hasEpp, setHasEpp] = useState(visitor?.contractorDetails?.hasEpp ?? true);
  const [highRiskPermit, setHighRiskPermit] = useState(visitor?.contractorDetails?.highRiskPermit ?? false);
  const [highRiskType, setHighRiskType] = useState(visitor?.contractorDetails?.highRiskType || "Trabajos en Alturas");

  // Proveedor
  const [invoiceOrWaybill, setInvoiceOrWaybill] = useState(visitor?.supplierDetails?.invoiceOrWaybill || "");
  const [cargoType, setCargoType] = useState(visitor?.supplierDetails?.cargoType || "Insumos de Producción");
  const [trailerPlates, setTrailerPlates] = useState(visitor?.supplierDetails?.trailerPlates || visitor?.logisticsDetails?.trailerPlates || "");
  const [materialsDescription, setMaterialsDescription] = useState(visitor?.supplierDetails?.materialsDescription || "");
  const [ndaExpirationDate, setNdaExpirationDate] = useState(visitor?.supplierDetails?.ndaExpirationDate || visitor?.ndaExpirationDate || "");

  // Transportista / Logística
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(visitor?.logisticsDetails?.driverLicenseNumber || "");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(visitor?.logisticsDetails?.insurancePolicyNumber || visitor?.insurancePolicyNumber || "");
  const [insuranceExpirationDate, setInsuranceExpirationDate] = useState(visitor?.logisticsDetails?.insurancePolicyExpiration || visitor?.insuranceExpirationDate || "");
  const [waybillOrRemissionFolio, setWaybillOrRemissionFolio] = useState(visitor?.logisticsDetails?.waybillOrRemissionFolio || "");
  const [cargoDescription, setCargoDescription] = useState(visitor?.logisticsDetails?.cargoDescription || "");

  // Entrevista
  const [jobPositionApplied, setJobPositionApplied] = useState(visitor?.interviewDetails?.jobPositionApplied || "");
  const [recruiterName, setRecruiterName] = useState(visitor?.interviewDetails?.recruiterName || "");
  const [vacancyFolio, setVacancyFolio] = useState(visitor?.interviewDetails?.vacancyFolio || "");

  // General
  const [visitReason, setVisitReason] = useState(visitor?.generalDetails?.visitReason || "");
  const [companionCount, setCompanionCount] = useState<number>(
    visitor?.companionCount || visitor?.generalDetails?.companionCount || (visitor?.companions?.length || 0)
  );
  const [companionsList, setCompanionsList] = useState<{ fullName: string; idNumber: string; company: string; badgeNumber?: string }[]>(
    visitor?.companions || visitor?.generalDetails?.companions || []
  );

  const [allProfiles, setAllProfiles] = useState<VisitorProfile[]>([]);
  const [matchedPreviousVisitor, setMatchedPreviousVisitor] = useState<Visitor | VisitorProfile | null>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [frequentSearchResults, setFrequentSearchResults] = useState<Array<Visitor | VisitorProfile>>([]);
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccessVisitor, setSavedSuccessVisitor] = useState<Visitor | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);

  // Subscribe to persistent profiles
  useEffect(() => {
    const unsub = subscribeVisitorProfiles((profiles) => {
      setAllProfiles(profiles);
    });
    return () => unsub();
  }, []);

  // Synchronize component state whenever visitor prop changes or modal opens
  useEffect(() => {
    if (visitor) {
      setFullName(visitor.fullName || "");
      setCompany(visitor.company || "");
      setCompanyRfc(visitor.companyRfc || "");
      setEmail(visitor.email || "");
      setPhone(visitor.phone || "");
      setIdType(visitor.idType || "INE");
      setIdNumber(visitor.idNumber || "");
      setEmergencyContactName(visitor.emergencyContactName || "");
      setEmergencyContactPhone(visitor.emergencyContactPhone || "");
      setBloodType(visitor.bloodType || "");
      setAllergies(visitor.allergies || "");

      setAccessType(visitor.accessType || "Visita General");
      setSelectedHostId(visitor.hostId || (hosts[0]?.id || ""));
      setZone(visitor.zone || "Planta Principal");
      setScheduledDateTime(
        visitor.scheduledDateTime
          ? new Date(visitor.scheduledDateTime).toISOString().slice(0, 16)
          : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
      );
      setVehiclePlates(visitor.vehiclePlates || "");
      setVehicleModel(visitor.vehicleModel || "");
      setVehicleColor(visitor.vehicleColor || "");
      setEquipmentRegistered(visitor.equipmentRegistered || "");
      setStatus(visitor.status || "PENDING");
      setBadgeNumber(visitor.badgeNumber || "");
      setRejectionReason(visitor.rejectionReason || "");
      setCancellationReason(visitor.cancellationReason || "");

      setWorkOrderPo(visitor.contractorDetails?.workOrderPo || "");
      setImssInsuranceNum(visitor.contractorDetails?.imssInsuranceNum || visitor.imssNumber || "");
      setImssExpirationDate(visitor.contractorDetails?.imssExpirationDate || visitor.imssExpirationDate || "");
      setSuaPaymentProof(visitor.contractorDetails?.suaPaymentProof || visitor.suaPaymentProof || "");
      setDc3Certification(visitor.contractorDetails?.dc3Certification || visitor.dc3Certification || "");
      setAntidopingCertificate(visitor.contractorDetails?.antidopingCertificate || visitor.antidopingCertificate || "");
      setWorkPlanDescription(visitor.contractorDetails?.workPlanDescription || visitor.workPlanDescription || "");
      setAstPermitFolio(visitor.contractorDetails?.astPermitFolio || "");
      setHasEpp(visitor.contractorDetails?.hasEpp ?? true);
      setHighRiskPermit(visitor.contractorDetails?.highRiskPermit ?? false);
      setHighRiskType(visitor.contractorDetails?.highRiskType || "Trabajos en Alturas");

      setInvoiceOrWaybill(visitor.supplierDetails?.invoiceOrWaybill || "");
      setCargoType(visitor.supplierDetails?.cargoType || "Insumos de Producción");
      setTrailerPlates(visitor.supplierDetails?.trailerPlates || visitor.logisticsDetails?.trailerPlates || "");
      setMaterialsDescription(visitor.supplierDetails?.materialsDescription || "");
      setNdaExpirationDate(visitor.supplierDetails?.ndaExpirationDate || visitor.ndaExpirationDate || "");

      setDriverLicenseNumber(visitor.logisticsDetails?.driverLicenseNumber || "");
      setInsurancePolicyNumber(visitor.logisticsDetails?.insurancePolicyNumber || visitor.insurancePolicyNumber || "");
      setInsuranceExpirationDate(visitor.logisticsDetails?.insurancePolicyExpiration || visitor.insuranceExpirationDate || "");
      setWaybillOrRemissionFolio(visitor.logisticsDetails?.waybillOrRemissionFolio || "");
      setCargoDescription(visitor.logisticsDetails?.cargoDescription || "");

      setJobPositionApplied(visitor.interviewDetails?.jobPositionApplied || "");
      setRecruiterName(visitor.interviewDetails?.recruiterName || "");
      setVacancyFolio(visitor.interviewDetails?.vacancyFolio || "");

      setVisitReason(visitor.generalDetails?.visitReason || "");
      const existingCompanions = visitor.companions || visitor.generalDetails?.companions || [];
      setCompanionsList(existingCompanions);
      setCompanionCount(visitor.companionCount || visitor.generalDetails?.companionCount || existingCompanions.length);
      setSavedSuccessVisitor(null);
    } else {
      setFullName("");
      setCompany("");
      setCompanyRfc("");
      setEmail("");
      setPhone("");
      setIdType("INE");
      setIdNumber("");
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setBloodType("");
      setAllergies("");

      setAccessType("Visita General");
      setSelectedHostId(hosts[0]?.id || "");
      setZone("Planta Principal");
      setScheduledDateTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
      setVehiclePlates("");
      setVehicleModel("");
      setVehicleColor("");
      setEquipmentRegistered("");
      setStatus("PENDING");
      setBadgeNumber("");
      setRejectionReason("");
      setCancellationReason("");

      setWorkOrderPo("");
      setImssInsuranceNum("");
      setImssExpirationDate("");
      setSuaPaymentProof("");
      setDc3Certification("");
      setAntidopingCertificate("");
      setWorkPlanDescription("");
      setAstPermitFolio("");
      setHasEpp(true);
      setHighRiskPermit(false);
      setHighRiskType("Trabajos en Alturas");

      setInvoiceOrWaybill("");
      setCargoType("Insumos de Producción");
      setTrailerPlates("");
      setMaterialsDescription("");
      setNdaExpirationDate("");

      setDriverLicenseNumber("");
      setInsurancePolicyNumber("");
      setInsuranceExpirationDate("");
      setWaybillOrRemissionFolio("");
      setCargoDescription("");

      setJobPositionApplied("");
      setRecruiterName("");
      setVacancyFolio("");

      setVisitReason("");
      setCompanionCount(0);
      setCompanionsList([]);
      setSavedSuccessVisitor(null);
    }
  }, [visitor, hosts]);

  // Sync companion list size with companion count AND automatically assign sequential badges
  const handleCompanionCountChange = (count: number) => {
    const validCount = Math.max(0, Math.min(20, count));
    setCompanionCount(validCount);

    setCompanionsList((prev) => {
      const next = [...prev];
      if (next.length < validCount) {
        // Collect already used badges in the form (main visitor + existing companions)
        const currentUsedBadges: string[] = [];
        if (badgeNumber.trim()) {
          currentUsedBadges.push(badgeNumber.trim().toUpperCase());
        }
        next.forEach((comp) => {
          if (comp.badgeNumber && comp.badgeNumber.trim()) {
            currentUsedBadges.push(comp.badgeNumber.trim().toUpperCase());
          }
        });

        const neededCount = validCount - next.length;
        const autoAssigned = getSequentialAvailableBadges(
          accessType,
          allVisitors,
          neededCount,
          currentUsedBadges
        );

        for (let i = 0; i < neededCount; i++) {
          next.push({
            fullName: "",
            idNumber: "",
            company: company || "",
            badgeNumber: autoAssigned[i] || ""
          });
        }
      } else {
        next.splice(validCount);
      }
      return next;
    });
  };

  // Re-generate / Auto-assign all companion badges sequentially
  const handleRegenerateAllCompanionBadges = () => {
    if (companionsList.length === 0) return;
    const initialExcluded: string[] = [];
    if (badgeNumber.trim()) {
      initialExcluded.push(badgeNumber.trim().toUpperCase());
    }

    const newBadges = getSequentialAvailableBadges(
      accessType,
      allVisitors,
      companionsList.length,
      initialExcluded
    );

    setCompanionsList((prev) =>
      prev.map((comp, idx) => ({
        ...comp,
        badgeNumber: newBadges[idx] || comp.badgeNumber
      }))
    );
  };

  const handleCompanionFieldChange = (index: number, field: "fullName" | "idNumber" | "company" | "badgeNumber", value: string) => {
    setCompanionsList((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Quick search for returning visitors in modal across Visitor Profiles and Appointments
  const handleQuickSearch = (query: string) => {
    setQuickSearchQuery(query);
    setAutoFillSuccessMessage(null);
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setFrequentSearchResults([]);
      return;
    }

    const cleanQ = q.replace(/[^a-z0-9]/gi, "");
    const matches: Array<Visitor | VisitorProfile> = [];

    // 1. Search in persistent Visitor Profiles
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
        (cleanQ && pCleanId && pCleanId.includes(cleanQ)) ||
        (pPhone && pPhone.includes(q)) ||
        (cleanQ && pCleanPhone && pCleanPhone.includes(cleanQ)) ||
        (pName && pName.includes(q)) ||
        (pCompany && pCompany.includes(q)) ||
        (pEmail && pEmail.includes(q))
      ) {
        matches.push(p);
      }
    });

    // 2. Search in all appointments
    allVisitors.forEach((v) => {
      if (v.id === visitor?.id) return;
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
        (cleanQ && vCleanId && vCleanId.includes(cleanQ)) ||
        (vPhone && vPhone.includes(q)) ||
        (cleanQ && vCleanPhone && vCleanPhone.includes(cleanQ)) ||
        (vName && vName.includes(q)) ||
        (vCompany && vCompany.includes(q)) ||
        (vEmail && vEmail.includes(q)) ||
        (vFolio && vFolio.includes(q))
      ) {
        matches.push(v);
      }
    });

    const uniqueMap = new Map<string, Visitor | VisitorProfile>();
    matches.forEach((item) => {
      const key = ((item.idNumber && item.idNumber !== "S/N" ? item.idNumber : "") || item.email || item.phone || item.fullName).trim().toLowerCase();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    setFrequentSearchResults(Array.from(uniqueMap.values()).slice(0, 6));
  };

  // Populate modal fields from matched visitor profile or past appointment
  const populateFromVisitor = (v: Visitor | VisitorProfile) => {
    setFullName(v.fullName || "");
    setCompany(v.company || "");
    if (v.companyRfc) setCompanyRfc(v.companyRfc);
    setEmail(v.email || "");
    setPhone(v.phone || "");
    setIdType(v.idType || "INE");
    setIdNumber(v.idNumber || "");
    if (v.vehiclePlates) setVehiclePlates(v.vehiclePlates);
    if (v.vehicleModel) setVehicleModel(v.vehicleModel);
    if (v.vehicleColor) setVehicleColor(v.vehicleColor);
    if (v.emergencyContactName) setEmergencyContactName(v.emergencyContactName);
    if (v.emergencyContactPhone) setEmergencyContactPhone(v.emergencyContactPhone);
    if (v.bloodType) setBloodType(v.bloodType);
    if (v.allergies) setAllergies(v.allergies);
    if (v.accessType) setAccessType(v.accessType);

    const vis = v as Visitor;
    if (vis.equipmentRegistered) setEquipmentRegistered(vis.equipmentRegistered);

    if (vis.contractorDetails) {
      if (vis.contractorDetails.workOrderPo) setWorkOrderPo(vis.contractorDetails.workOrderPo);
      if (vis.contractorDetails.imssInsuranceNum) setImssInsuranceNum(vis.contractorDetails.imssInsuranceNum);
      if (vis.contractorDetails.imssExpirationDate) setImssExpirationDate(vis.contractorDetails.imssExpirationDate);
      if (vis.contractorDetails.suaPaymentProof) setSuaPaymentProof(vis.contractorDetails.suaPaymentProof);
      if (vis.contractorDetails.dc3Certification) setDc3Certification(vis.contractorDetails.dc3Certification);
      if (vis.contractorDetails.antidopingCertificate) setAntidopingCertificate(vis.contractorDetails.antidopingCertificate);
      if (vis.contractorDetails.workPlanDescription) setWorkPlanDescription(vis.contractorDetails.workPlanDescription);
      if (vis.contractorDetails.astPermitFolio) setAstPermitFolio(vis.contractorDetails.astPermitFolio);
      if (vis.contractorDetails.hasEpp !== undefined) setHasEpp(vis.contractorDetails.hasEpp);
      if (vis.contractorDetails.highRiskPermit !== undefined) setHighRiskPermit(vis.contractorDetails.highRiskPermit);
      if (vis.contractorDetails.highRiskType) setHighRiskType(vis.contractorDetails.highRiskType);
    } else if (v.imssNumber) {
      setImssInsuranceNum(v.imssNumber);
      if (v.imssExpirationDate) setImssExpirationDate(v.imssExpirationDate);
      if (v.suaPaymentProof) setSuaPaymentProof(v.suaPaymentProof);
      if (v.dc3Certification) setDc3Certification(v.dc3Certification);
      if (v.antidopingCertificate) setAntidopingCertificate(v.antidopingCertificate);
      if (v.workPlanDescription) setWorkPlanDescription(v.workPlanDescription);
    }

    if (vis.supplierDetails) {
      if (vis.supplierDetails.invoiceOrWaybill) setInvoiceOrWaybill(vis.supplierDetails.invoiceOrWaybill);
      if (vis.supplierDetails.cargoType) setCargoType(vis.supplierDetails.cargoType);
      if (vis.supplierDetails.trailerPlates) setTrailerPlates(vis.supplierDetails.trailerPlates);
      if (vis.supplierDetails.materialsDescription) setMaterialsDescription(vis.supplierDetails.materialsDescription);
      if (vis.supplierDetails.ndaExpirationDate) setNdaExpirationDate(vis.supplierDetails.ndaExpirationDate);
    }

    if (vis.logisticsDetails) {
      if (vis.logisticsDetails.driverLicenseNumber) setDriverLicenseNumber(vis.logisticsDetails.driverLicenseNumber);
      if (vis.logisticsDetails.insurancePolicyNumber) setInsurancePolicyNumber(vis.logisticsDetails.insurancePolicyNumber);
      if (vis.logisticsDetails.insurancePolicyExpiration) setInsuranceExpirationDate(vis.logisticsDetails.insurancePolicyExpiration);
      if (vis.logisticsDetails.waybillOrRemissionFolio) setWaybillOrRemissionFolio(vis.logisticsDetails.waybillOrRemissionFolio);
      if (vis.logisticsDetails.trailerPlates) setTrailerPlates(vis.logisticsDetails.trailerPlates);
      if (vis.logisticsDetails.cargoDescription) setCargoDescription(vis.logisticsDetails.cargoDescription);
      if (vis.logisticsDetails.antidopingCertificate) setAntidopingCertificate(vis.logisticsDetails.antidopingCertificate);
      if (vis.logisticsDetails.suaPaymentProof) setSuaPaymentProof(vis.logisticsDetails.suaPaymentProof);
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

    setMatchedPreviousVisitor(null);
    setQuickSearchQuery("");
    setFrequentSearchResults([]);
    setAutoFillSuccessMessage(`¡Datos de ${v.fullName} (${v.company}) cargados exitosamente!`);
  };

  // Check for auto-complete from previous records by ID, Phone, or Name (threshold >= 5 or 6 characters for security)
  useEffect(() => {
    if (isEditing) return;

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
        setMatchedPreviousVisitor(matchProfile);
        return;
      }

      const match = allVisitors.find((v) => {
        if (v.id === visitor?.id) return false;
        const vId = (v.idNumber || "").toLowerCase();
        const vCleanId = vId.replace(/[^a-z0-9]/gi, "");
        const vPhone = (v.phone || "").toLowerCase();
        const vCleanPhone = vPhone.replace(/[^a-z0-9]/gi, "");

        if (hasValidIdTerm && vCleanId && (vCleanId === cleanTermId || vCleanId.includes(cleanTermId))) return true;
        if (hasValidPhoneTerm && vCleanPhone && (vCleanPhone === cleanTermPhone || vCleanPhone.includes(cleanTermPhone))) return true;
        if (hasValidNameTerm && v.fullName.toLowerCase() === termName) return true;
        return false;
      });

      setMatchedPreviousVisitor(match || null);
    } else {
      setMatchedPreviousVisitor(null);
    }
  }, [idNumber, phone, fullName, allVisitors, allProfiles, isEditing, visitor]);

  // Generate automatic badge code based on type
  const handleAutoAssignBadge = () => {
    const autoBadge = getAvailableBadgeNumber(accessType, allVisitors);
    setBadgeNumber(autoBadge);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !company.trim() || !email.trim() || !selectedHostId) {
      alert("Por favor complete los campos obligatorios (*).");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedHost = hosts.find((h) => h.id === selectedHostId) || hosts[0];
      const now = new Date().toISOString();

      // Auto-assign badge for main visitor if status is CHECKED_IN and badge is empty
      let finalBadgeNumber = badgeNumber.trim().toUpperCase();
      if (status === "CHECKED_IN" && !finalBadgeNumber) {
        finalBadgeNumber = getAvailableBadgeNumber(accessType, allVisitors);
      }

      // Ensure companions also have badges assigned if status is CHECKED_IN or user requested
      const processedCompanions = companionsList.map((c, i) => {
        if (status === "CHECKED_IN" && !c.badgeNumber) {
          const used = [finalBadgeNumber, ...companionsList.slice(0, i).map(x => x.badgeNumber || "")];
          return {
            ...c,
            badgeNumber: getAvailableBadgeNumber(accessType, allVisitors, used)
          };
        }
        return c;
      });

      const typeSpecificData: Partial<Visitor> = {
        companyRfc: companyRfc.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        bloodType: bloodType.trim() || undefined,
        allergies: allergies.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleColor: vehicleColor.trim() || undefined,
        companionCount: Number(companionCount) || 0,
        companions: processedCompanions
      };

      if (accessType === "Contratista") {
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
        typeSpecificData.workOrder = workOrderPo.trim();
      } else if (accessType === "Proveedor") {
        typeSpecificData.supplierDetails = {
          invoiceOrWaybill: invoiceOrWaybill.trim(),
          cargoType: cargoType.trim(),
          trailerPlates: trailerPlates.trim().toUpperCase(),
          materialsDescription: materialsDescription.trim(),
          ndaExpirationDate: ndaExpirationDate || undefined
        };
        typeSpecificData.purchaseOrder = invoiceOrWaybill.trim();
        typeSpecificData.cargoType = cargoType.trim();
        typeSpecificData.ndaExpirationDate = ndaExpirationDate || undefined;
      } else if (accessType === "Transportista") {
        typeSpecificData.logisticsDetails = {
          driverLicenseNumber: driverLicenseNumber.trim(),
          insurancePolicyNumber: insurancePolicyNumber.trim(),
          insurancePolicyExpiration: insuranceExpirationDate || undefined,
          waybillOrRemissionFolio: waybillOrRemissionFolio.trim(),
          trailerPlates: trailerPlates.trim().toUpperCase(),
          cargoDescription: cargoDescription.trim(),
          antidopingCertificate: antidopingCertificate.trim(),
          suaPaymentProof: suaPaymentProof.trim()
        };
        typeSpecificData.driverLicenseNumber = driverLicenseNumber.trim();
        typeSpecificData.insurancePolicyNumber = insurancePolicyNumber.trim();
        typeSpecificData.insuranceExpirationDate = insuranceExpirationDate || undefined;
        typeSpecificData.cargoType = cargoDescription.trim();
        typeSpecificData.antidopingCertificate = antidopingCertificate.trim();
        typeSpecificData.suaPaymentProof = suaPaymentProof.trim();
      } else if (accessType === "Entrevista") {
        typeSpecificData.interviewDetails = {
          jobPositionApplied: jobPositionApplied.trim(),
          recruiterName: recruiterName.trim(),
          vacancyFolio: vacancyFolio.trim()
        };
        typeSpecificData.interviewPosition = jobPositionApplied.trim();
      } else if (accessType === "Visita General") {
        typeSpecificData.generalDetails = {
          visitReason: visitReason.trim(),
          companionCount: Number(companionCount) || 0,
          companions: processedCompanions
        };
      }

      let parsedScheduledDate = now;
      try {
        if (scheduledDateTime) {
          const d = new Date(scheduledDateTime);
          if (!isNaN(d.getTime())) {
            parsedScheduledDate = d.toISOString();
          }
        }
      } catch (err) {
        console.warn("Invalid scheduledDateTime, defaulting to now:", err);
      }

      let finalSavedRecord: Visitor;

      if (isEditing && visitor) {
        const updates: Partial<Visitor> = {
          fullName: fullName.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          idType,
          idNumber: idNumber.trim(),
          accessType,
          hostId: selectedHostId,
          hostName: selectedHost ? selectedHost.fullName : visitor.hostName,
          hostEmail: selectedHost ? selectedHost.email : visitor.hostEmail,
          department: selectedHost ? selectedHost.department : visitor.department,
          zone,
          scheduledDateTime: parsedScheduledDate,
          vehiclePlates: vehiclePlates.trim().toUpperCase(),
          equipmentRegistered: equipmentRegistered.trim(),
          status,
          badgeNumber: finalBadgeNumber,
          checkInTime: status === "CHECKED_IN" && !visitor.checkInTime ? now : visitor.checkInTime,
          rejectionReason: status === "REJECTED" ? rejectionReason : "",
          cancellationReason: status === "CANCELLED" ? cancellationReason : "",
          ...typeSpecificData
        };

        await updateVisitor(visitor.id, updates, effectiveActor);

        const updatedVisitorObj: Visitor = { ...visitor, ...updates };
        finalSavedRecord = updatedVisitorObj;

        if (status === "APPROVED" && visitor.status !== "APPROVED") {
          sendNoReplyEmailNotification("APROBACION", updatedVisitorObj).catch(() => {});
        } else if (status === "CHECKED_IN" && visitor.status !== "CHECKED_IN") {
          sendNoReplyEmailNotification("EXPRESS_CHECKIN", updatedVisitorObj).catch(() => {});
        } else if (status === "REJECTED" && visitor.status !== "REJECTED") {
          sendNoReplyEmailNotification("RECHAZO", updatedVisitorObj, rejectionReason).catch(() => {});
        } else if (status === "CANCELLED" && visitor.status !== "CANCELLED") {
          sendNoReplyEmailNotification("CANCELACION", updatedVisitorObj, cancellationReason).catch(() => {});
        }
      } else {
        const folio = generateQRFolio();
        const newVisitorData: Omit<Visitor, "id"> = {
          fullName: fullName.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          idType,
          idNumber: idNumber.trim() || "S/N",
          accessType,
          hostId: selectedHostId,
          hostName: selectedHost ? selectedHost.fullName : "Anfitrión",
          hostEmail: selectedHost ? selectedHost.email : "",
          department: selectedHost ? selectedHost.department : "General",
          zone,
          scheduledDateTime: parsedScheduledDate,
          vehiclePlates: vehiclePlates.trim().toUpperCase(),
          equipmentRegistered: equipmentRegistered.trim(),
          healthDeclaration: true,
          status,
          badgeNumber: finalBadgeNumber,
          checkInTime: status === "CHECKED_IN" ? now : undefined,
          qrFolio: folio,
          createdAt: now,
          updatedAt: now,
          isExpress: true,
          isExternal: false,
          ...typeSpecificData
        };

        const createdId = await addVisitor(newVisitorData);
        const createdVisitorObj: Visitor = { ...newVisitorData, id: createdId };
        finalSavedRecord = createdVisitorObj;

        if (status === "CHECKED_IN") {
          sendNoReplyEmailNotification("EXPRESS_CHECKIN", createdVisitorObj).catch(() => {});
        } else if (status === "PENDING") {
          sendNoReplyEmailNotification("SOLICITUD", createdVisitorObj).catch(() => {});
        } else if (status === "APPROVED") {
          sendNoReplyEmailNotification("APROBACION", createdVisitorObj).catch(() => {});
        }
      }

      // Show instant confirmation screen with all recorded details and actions
      setSavedSuccessVisitor(finalSavedRecord);
    } catch (err) {
      console.error("Error saving visitor:", err);
      alert("Ocurrió un error al guardar los datos del visitante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 relative my-8">
        
        {/* SUCCESS CONFIRMATION SCREEN */}
        {savedSuccessVisitor ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {isEditing ? "¡Registro Actualizado Exitosamente!" : "¡Cita / Registro Creado con Éxito!"}
              </h3>
              <p className="text-xs text-slate-600">
                Los datos han sido guardados y sincronizados en tiempo real en la base de datos de control de acceso.
              </p>
            </div>

            {/* Summary card of registered data */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Folio de Acceso QR</span>
                  <span className="font-mono font-black text-sm text-blue-900">{savedSuccessVisitor.qrFolio}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado</span>
                  <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {savedSuccessVisitor.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Visitante Principal:</span>
                  <p className="font-bold text-slate-900">{savedSuccessVisitor.fullName}</p>
                  <p className="text-slate-500">{savedSuccessVisitor.company}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Anfitrión / Destino:</span>
                  <p className="font-bold text-slate-900">{savedSuccessVisitor.hostName}</p>
                  <p className="text-slate-500">{savedSuccessVisitor.department} • {savedSuccessVisitor.zone}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Gafete Asignado:</span>
                  <p className="font-mono font-black text-slate-900">
                    {savedSuccessVisitor.badgeNumber || "No asignado (Pendiente)"}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Fecha y Hora:</span>
                  <p className="font-semibold text-slate-800">
                    {formatSpanishDate(savedSuccessVisitor.scheduledDateTime)}
                  </p>
                </div>
              </div>

              {/* Companions Badge Overview */}
              {savedSuccessVisitor.companions && savedSuccessVisitor.companions.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">
                    👥 Acompañantes Registrados ({savedSuccessVisitor.companions.length}):
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {savedSuccessVisitor.companions.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-800">
                          {idx + 1}. {comp.fullName || "Acompañante"} {comp.company ? `(${comp.company})` : ""}
                        </span>
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          Gafete: {comp.badgeNumber || "S/G"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions: View Pass or Close */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassModal(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Ver Pase Digital con QR</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Finalizar y Salir</span>
              </button>
            </div>

            {showPassModal && savedSuccessVisitor && (
              <DigitalPassModal
                visitor={savedSuccessVisitor}
                onClose={() => setShowPassModal(false)}
              />
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {isEditing ? "Editar Registro de Visitante" : "Registrar Nuevo Visitante / Cita"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isEditing ? `Folio QR: ${visitor?.qrFolio}` : "Información completa y asignación de datos de acceso"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Immutability Banner: Finalized (Rejected or Cancelled) */}
            {isFinalizedRecord && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-950">
                    Registro Finalizado e Inmutable ({visitor?.status === 'REJECTED' ? 'Cita Rechazada' : 'Cita Cancelada'})
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Por normativas de auditoría y seguridad de planta, una vez rechazada o cancelada una cita, el registro queda sellado y no se permiten modificaciones.
                  </p>
                  {visitor?.rejectionReason && (
                    <p className="font-medium text-[11px] text-rose-800 bg-rose-100/70 px-2 py-1 rounded">
                      <strong>Motivo de rechazo registrado:</strong> {visitor.rejectionReason}
                    </p>
                  )}
                  {visitor?.cancellationReason && (
                    <p className="font-medium text-[11px] text-rose-800 bg-rose-100/70 px-2 py-1 rounded">
                      <strong>Motivo de cancelación registrado:</strong> {visitor.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Immutability Banner: Approved or In Plant */}
            {isApprovedRecord && !isFinalizedRecord && (
              <div className="p-4 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-950">
                    Cita Autorizada ({visitor?.status === 'CHECKED_IN' ? 'En Planta' : visitor?.status === 'CHECKED_OUT' ? 'Visita Finalizada' : 'Aprobada'})
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Los datos de pre-registro (Visitante, Anfitrión, Empresa y Motivo) están sellados para proteger la veracidad del pase original. Solo Caseta puede actualizar el número de gafete o registrar el Check-In / Check-Out.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Returning Visitor Search Bar for Express/New Registration */}
            {!isEditing && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-4 border-b border-blue-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>¿Visitante Ya Registrado Anteriormente?</span>
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Auto-llenado Rápido
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre, INE, Teléfono o Empresa (mínimo 4 caracteres)..."
                    value={quickSearchQuery}
                    onChange={(e) => handleQuickSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {autoFillSuccessMessage && (
                  <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{autoFillSuccessMessage}</span>
                  </div>
                )}

                {frequentSearchResults.length > 0 && (
                  <div className="bg-white border border-indigo-200 rounded-xl p-2 space-y-1 shadow-md">
                    <p className="text-[11px] font-bold text-slate-500 px-2">Coincidencias encontradas (clic para cargar):</p>
                    {frequentSearchResults.map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => populateFromVisitor(match)}
                        className="w-full text-left p-2 hover:bg-indigo-50 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-indigo-950">{match.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            {match.company} • {match.idType}: {match.idNumber}
                          </p>
                        </div>
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-1 rounded-md">
                          Cargar Datos
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Smart Banner if visitor match detected while typing */}
            {matchedPreviousVisitor && !autoFillSuccessMessage && !isEditing && (
              <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Se detectó historial de <strong>{matchedPreviousVisitor.fullName}</strong> ({matchedPreviousVisitor.company}).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => populateFromVisitor(matchedPreviousVisitor)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] shrink-0"
                >
                  Auto-Completar
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Datos Personales */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  1. Datos Generales del Visitante
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez Garza"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Empresa / Razón Social *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Servicios Industriales del Norte"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RFC de la Empresa (Opcional)</label>
                    <input
                      type="text"
                      placeholder="SIN010203ABC"
                      value={companyRfc}
                      onChange={(e) => setCompanyRfc(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                    <input
                      type="tel"
                      placeholder="55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Identificación Oficial</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as IdType)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="INE">INE / Credencial de Elector</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="Licencia">Licencia de Conducir</option>
                      <option value="Cédula Profesional">Cédula Profesional</option>
                      <option value="Credencial Empresa">Credencial de Empresa</option>
                      <option value="Otro">Otro Documento Oficial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Identificación / Folio</label>
                    <input
                      type="text"
                      placeholder="Ej. IDMEX12345678"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>
                </div>

                {/* Emergency & Health subsection */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Contacto de Emergencia</label>
                    <input
                      type="text"
                      placeholder="Nombre de Familiar / Contacto"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Teléfono de Emergencia</label>
                    <input
                      type="tel"
                      placeholder="55 9876 5432"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tipo de Sangre</label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="">No especificado</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Alergias o Padecimientos</label>
                    <input
                      type="text"
                      placeholder="Penicilina, Asma, Ninguna..."
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tipo de Acceso & Requisitos Dinámicos */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  2. Tipo de Acceso y Datos Específicos
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Tipo de Visita *</label>
                  <select
                    value={accessType}
                    onChange={(e) => {
                      const newType = e.target.value as AccessType;
                      setAccessType(newType);
                      if (companionsList.length > 0) {
                        const newBadges = getSequentialAvailableBadges(newType, allVisitors, companionsList.length);
                        setCompanionsList(prev => prev.map((c, i) => ({ ...c, badgeNumber: newBadges[i] || c.badgeNumber })));
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Visita General">Visita General / Junta Comercial / Auditoría</option>
                    <option value="Contratista">Contratista / Mantenimiento / Obra</option>
                    <option value="Proveedor">Proveedor / Entrega de Insumos / Facturación</option>
                    <option value="Transportista">Transportista / Logística de Carga / Patio</option>
                    <option value="Entrevista">Entrevista de Trabajo / Recursos Humanos</option>
                  </select>
                </div>

                {/* Sub-form: Contratista */}
                {accessType === "Contratista" && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold">
                      <HardHat className="w-4 h-4 text-amber-700" />
                      <span>Requisitos de Seguridad Industrial (Contratistas) & STPS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Orden de Compra / Folio PO</label>
                        <input
                          type="text"
                          placeholder="PO-2026-XXXX"
                          value={workOrderPo}
                          onChange={(e) => setWorkOrderPo(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">NSS / Póliza de Seguro IMSS</label>
                        <input
                          type="text"
                          placeholder="No. Seguro Social / Alta IMSS"
                          value={imssInsuranceNum}
                          onChange={(e) => setImssInsuranceNum(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Vigencia Pago IMSS Mensual</label>
                        <input
                          type="date"
                          value={imssExpirationDate}
                          onChange={(e) => setImssExpirationDate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio Comprobante Pago SUA / IMSS</label>
                        <input
                          type="text"
                          placeholder="SUA-2026-08 / Folio Bancario"
                          value={suaPaymentProof}
                          onChange={(e) => setSuaPaymentProof(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Constancia Habilidades DC-3 (STPS)</label>
                        <input
                          type="text"
                          placeholder="DC3-ALTURAS-2026 / DC3-MANTTO"
                          value={dc3Certification}
                          onChange={(e) => setDc3Certification(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio Certificado Antidoping Vigente</label>
                        <input
                          type="text"
                          placeholder="LAB-ANTI-2026-NEG"
                          value={antidopingCertificate}
                          onChange={(e) => setAntidopingCertificate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio Permiso AST por Cita</label>
                        <input
                          type="text"
                          placeholder="AST-2026-01"
                          value={astPermitFolio}
                          onChange={(e) => setAstPermitFolio(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Plan de Trabajo / Actividad</label>
                        <input
                          type="text"
                          placeholder="Mantenimiento en Subestación Eléctrica"
                          value={workPlanDescription}
                          onChange={(e) => setWorkPlanDescription(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-amber-200">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasEpp}
                          onChange={(e) => setHasEpp(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-bold text-slate-800">
                          Cuenta con Equipo de Protección Personal (Casco, Botas con casquillo, Chaleco)
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={highRiskPermit}
                          onChange={(e) => setHighRiskPermit(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-bold text-slate-800">
                          Requiere Permiso de Trabajo de Alto Riesgo
                        </span>
                      </label>
                    </div>

                    {highRiskPermit && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipo de Trabajo de Alto Riesgo</label>
                        <select
                          value={highRiskType}
                          onChange={(e) => setHighRiskType(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                        >
                          <option value="Trabajos en Alturas">Trabajos en Alturas (&gt; 1.80m)</option>
                          <option value="Corte y Soldadura (Trabajos en Caliente)">Corte y Soldadura (Trabajos en Caliente)</option>
                          <option value="Espacios Confinados">Espacios Confinados</option>
                          <option value="Intervención Eléctrica / Tableros">Intervención Eléctrica / Tableros</option>
                          <option value="Manejo de Sustancias Químicas">Manejo de Sustancias Químicas Peligrosas</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-form: Proveedor */}
                {accessType === "Proveedor" && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                      <Truck className="w-4 h-4 text-emerald-700" />
                      <span>Control de Embarques y Proveedores</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Factura / Carta Porte / Guía *</label>
                        <input
                          type="text"
                          placeholder="Folio de Factura o Remisión"
                          value={invoiceOrWaybill}
                          onChange={(e) => setInvoiceOrWaybill(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipo de Carga o Mercancía</label>
                        <select
                          value={cargoType}
                          onChange={(e) => setCargoType(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                        >
                          <option value="Insumos de Producción">Insumos de Producción / Materia Prima</option>
                          <option value="Paquetería y Mensajería">Paquetería y Mensajería Comercial</option>
                          <option value="Herramientas y Refacciones">Herramientas y Refacciones</option>
                          <option value="Alimentos / Comedor">Insumos para Comedor / Limpieza</option>
                          <option value="Material Peligroso / Químico">Material Peligroso / Químico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Placas del Remolque / Caja</label>
                        <input
                          type="text"
                          placeholder="Ej. 12-AA-34"
                          value={trailerPlates}
                          onChange={(e) => setTrailerPlates(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Vigencia de Acuerdo de Confidencialidad NDA</label>
                        <input
                          type="date"
                          value={ndaExpirationDate}
                          onChange={(e) => setNdaExpirationDate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Descripción Detallada de Materiales</label>
                        <input
                          type="text"
                          placeholder="Ej. 2 tarimas con bobinas de empaque, 5 cajas de tornillería"
                          value={materialsDescription}
                          onChange={(e) => setMaterialsDescription(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: Transportista / Logística */}
                {accessType === "Transportista" && (
                  <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-teal-900 font-bold">
                      <Truck className="w-4 h-4 text-teal-700" />
                      <span>Logística de Transporte de Carga, Carta Porte y Patio</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Licencia de Conducir Federal / Transporte *</label>
                        <input
                          type="text"
                          placeholder="Ej. LIC-FED-987654"
                          value={driverLicenseNumber}
                          onChange={(e) => setDriverLicenseNumber(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio de Carta Porte / Remisión *</label>
                        <input
                          type="text"
                          placeholder="CP-2026-XXXXX"
                          value={waybillOrRemissionFolio}
                          onChange={(e) => setWaybillOrRemissionFolio(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">No. Póliza de Seguro Vehicular de Carga</label>
                        <input
                          type="text"
                          placeholder="POL-QUALITAS-8899"
                          value={insurancePolicyNumber}
                          onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Vigencia de Póliza de Seguro</label>
                        <input
                          type="date"
                          value={insuranceExpirationDate}
                          onChange={(e) => setInsuranceExpirationDate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Placas del Remolque / Caja Seca o Refrigerada</label>
                        <input
                          type="text"
                          placeholder="Ej. TC-5544-B"
                          value={trailerPlates}
                          onChange={(e) => setTrailerPlates(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio Examen Antidoping / Toxicológico</label>
                        <input
                          type="text"
                          placeholder="ANTI-TOX-2026"
                          value={antidopingCertificate}
                          onChange={(e) => setAntidopingCertificate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Descripción de la Carga / Mercancía Transportada</label>
                        <input
                          type="text"
                          placeholder="Ej. Carga de bobinas de acero, 24 toneladas, destino andén 4"
                          value={cargoDescription}
                          onChange={(e) => setCargoDescription(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: Entrevista */}
                {accessType === "Entrevista" && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-purple-900 font-bold">
                      <User className="w-4 h-4 text-purple-700" />
                      <span>Reclutamiento y Selección de Personal</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Puesto Solicitado *</label>
                        <input
                          type="text"
                          placeholder="Ej. Operador de Producción"
                          value={jobPositionApplied}
                          onChange={(e) => setJobPositionApplied(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Reclutador Asignado</label>
                        <input
                          type="text"
                          placeholder="Ej. Lic. Laura Gómez"
                          value={recruiterName}
                          onChange={(e) => setRecruiterName(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Folio de Vacante</label>
                        <input
                          type="text"
                          placeholder="VAC-2026-09"
                          value={vacancyFolio}
                          onChange={(e) => setVacancyFolio(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: General & Companions */}
                {accessType === "Visita General" && (
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Motivo de la Visita</label>
                        <input
                          type="text"
                          placeholder="Ej. Reunión de planeación trimestral"
                          value={visitReason}
                          onChange={(e) => setVisitReason(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Número de Acompañantes</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={companionCount}
                          onChange={(e) => handleCompanionCountChange(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-blue-900"
                        />
                      </div>
                    </div>

                    {/* Detailed Companions Form Fields with Sequential Auto-Badge Assignment */}
                    {companionCount > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            👥 Acompañantes del Grupo ({companionsList.length}):
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleRegenerateAllCompanionBadges}
                              className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold px-2.5 py-1 rounded-lg"
                              title="Reasignar gafetes secuenciales únicos a todos los acompañantes"
                            >
                              ⚡ Re-asignar Gafetes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCompanionCountChange(companionCount + 1)}
                              className="text-[11px] bg-slate-200 hover:bg-slate-300 font-bold px-2.5 py-1 rounded-lg text-slate-800"
                            >
                              + Añadir
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {companionsList.map((comp, idx) => (
                            <div key={idx} className="p-2.5 bg-white border border-slate-300 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs items-center">
                              <div className="sm:col-span-1">
                                <label className="block text-[10px] text-slate-500 font-bold">Nombre #{idx + 1} *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nombre Completo"
                                  value={comp.fullName}
                                  onChange={(e) => handleCompanionFieldChange(idx, "fullName", e.target.value)}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold">No. Identificación / INE</label>
                                <input
                                  type="text"
                                  placeholder="No. INE / Pasaporte"
                                  value={comp.idNumber}
                                  onChange={(e) => handleCompanionFieldChange(idx, "idNumber", e.target.value)}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold">Empresa / Datos</label>
                                <input
                                  type="text"
                                  placeholder="Empresa o Nota"
                                  value={comp.company}
                                  onChange={(e) => handleCompanionFieldChange(idx, "company", e.target.value)}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 font-bold">Gafete (Automático)</label>
                                  <input
                                    type="text"
                                    placeholder="G-105"
                                    value={comp.badgeNumber || ""}
                                    onChange={(e) => handleCompanionFieldChange(idx, "badgeNumber", e.target.value)}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs uppercase font-bold text-blue-900"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCompanionCountChange(companionCount - 1)}
                                  className="text-rose-600 hover:bg-rose-50 p-1.5 rounded mt-3 text-xs font-bold"
                                  title="Remover acompañante"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Destino & Vehículo */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  3. Destino, Programación y Equipo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Anfitrión Seleccionado *</label>
                    <select
                      value={selectedHostId}
                      onChange={(e) => setSelectedHostId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {hosts.map((host) => (
                        <option key={host.id} value={host.id}>
                          {host.fullName} — ({host.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Zona Autorizada de Acceso</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      <option value="Planta Principal">Planta Principal - General</option>
                      <option value="Edificio Administrativo - Oficinas">Edificio Administrativo - Oficinas</option>
                      <option value="Área de Producción y Líneas">Área de Producción y Líneas</option>
                      <option value="Andenes de Carga y Descarga">Andenes de Carga y Descarga</option>
                      <option value="Almacén de Materias Primas">Almacén de Materias Primas</option>
                      <option value="Data Center / TI">Data Center / TI</option>
                      <option value="Laboratorio de Calidad">Laboratorio de Calidad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha y Hora Programada *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Placas de Vehículo</label>
                      <input
                        type="text"
                        placeholder="Ej. ABC-123-D"
                        value={vehiclePlates}
                        onChange={(e) => setVehiclePlates(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Modelo / Marca</label>
                      <input
                        type="text"
                        placeholder="Ej. Nissan Versa"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Color de Auto</label>
                      <input
                        type="text"
                        placeholder="Ej. Blanco / Plata"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Equipo / Herramienta a Ingresar</label>
                    <input
                      type="text"
                      placeholder="Ej. Laptop Dell Serie 98234, Multímetro Fluke"
                      value={equipmentRegistered}
                      onChange={(e) => setEquipmentRegistered(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Estado y Gafete */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  4. Estado del Pase y Asignación de Gafete
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estado de la Visita</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as VisitorStatus)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="APPROVED">APROBADO / AUTORIZADO</option>
                      <option value="PENDING">PENDIENTE DE AUTORIZACIÓN</option>
                      <option value="CHECKED_IN">EN PLANTA (Check-In)</option>
                      <option value="CHECKED_OUT">SALIDA REGISTRADA (Check-Out)</option>
                      <option value="REJECTED">RECHAZADO</option>
                      <option value="CANCELLED">CANCELADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Gafete</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. G-CON-101"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleAutoAssignBadge}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-2 rounded-lg whitespace-nowrap shadow-sm"
                        title="Auto-asignar gafete disponible según tipo de visitante"
                      >
                        ⚡ Auto Gafete
                      </button>
                    </div>
                  </div>

                  {status === "REJECTED" && (
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-rose-700 mb-1">Motivo del Rechazo</label>
                      <input
                        type="text"
                        placeholder="Escriba la razón de rechazo..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-900"
                      />
                    </div>
                  )}

                  {status === "CANCELLED" && (
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Motivo de Cancelación</label>
                      <input
                        type="text"
                        placeholder="Escriba la razón de la cancelación..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors"
                >
                  {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Registro de Visitante"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
