import React, { useState, useEffect, useRef } from "react";
import { X, Camera, QrCode, Search, Check, AlertCircle } from "lucide-react";
import { Visitor } from "../types";

interface QRScannerModalProps {
  visitors: Visitor[];
  onScanSuccess: (visitor: Visitor) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visitors,
  onScanSuccess,
  onClose
}) => {
  const [manualFolio, setManualFolio] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attempt to start camera stream
  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setErrorMsg("Cámara no disponible en este dispositivo o navegador.");
      }
    } catch (e) {
      console.warn("Camera access error:", e);
      setErrorMsg("No se pudo obtener acceso a la cámara. Utilice la búsqueda por Folio.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleSearchManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFolio.trim()) return;

    const searchTerm = manualFolio.trim().toUpperCase();
    const found = visitors.find(
      (v) =>
        v.qrFolio.toUpperCase().includes(searchTerm) ||
        v.id.toUpperCase().includes(searchTerm) ||
        v.fullName.toUpperCase().includes(searchTerm) ||
        (v.idNumber && v.idNumber.toUpperCase().includes(searchTerm))
    );

    if (found) {
      onScanSuccess(found);
      onClose();
    } else {
      setErrorMsg(`No se encontró ninguna cita correspondiente a "${manualFolio}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Lector / Escáner de Código QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Video Stream Area */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle */}
            <div className="absolute inset-0 border-2 border-blue-500/40 m-8 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 border-2 border-dashed border-emerald-400 rounded-xl animate-pulse"></div>
            </div>

            {!cameraActive && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-2">
                <Camera className="w-8 h-8 text-slate-500" />
                <p className="text-xs">Cámara en modo de espera o simulación</p>
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Reactivar Cámara
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Scan Shortcuts if visitors exist */}
          {visitors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Simular Escaneo Rápido (Citas Recientes)
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {visitors.slice(0, 5).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onScanSuccess(v);
                      onClose();
                    }}
                    className="text-xs bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{v.qrFolio}</span>
                    <span className="text-slate-400 text-[10px]">({v.fullName.split(" ")[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleSearchManual} className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              O Búsqueda Manual por Folio QR o Nombre
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. FOL-2026-X892 o Julián"
                  value={manualFolio}
                  onChange={(e) => setManualFolio(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1"
              >
                <span>Validar</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
