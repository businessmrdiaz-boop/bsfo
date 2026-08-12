'use client';

import { useEffect, useRef, useState } from 'react';
import type { Shipment } from './types';

interface ExtractedTicketData {
  ticketId: string;
  materialType: string;
  volume: string;
  destination: string;
  confidence: string;
  confirmationCode: string;
}

interface TicketScannerProps {
  onExtractedShipment: (shipment: Shipment) => void;
}

const acceptedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf'];
const materialOptions = ['Fresh Water', 'Crude Oil', 'Produced Water', 'Silica Sand', 'Hot Shot Equipment'];

const generateShipmentFromExtraction = (extracted: ExtractedTicketData): Shipment => {
  const etaMinutes = 45 + Math.floor(Math.random() * 75);
  const etaHours = `${String(Math.floor(etaMinutes / 60)).padStart(2, '0')}:${String(etaMinutes % 60).padStart(2, '0')} hrs`;

  return {
    loadId: extracted.ticketId,
    status: 'Verified',
    driver: 'AI Scan',
    destination: extracted.destination,
    eta: etaHours,
    confirmationCode: extracted.confirmationCode,
    rig: extracted.destination,
    materialType: extracted.materialType,
    tonnage: extracted.volume,
  };
};

export function TicketScanner({ onExtractedShipment }: TicketScannerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedTicketData | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isExtracted, setIsExtracted] = useState(false);
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (processingTimer.current) {
        clearTimeout(processingTimer.current);
      }
    };
  }, []);

  const resetScanner = (keepMessage = false) => {
    setFileName(null);
    setExtractedData(null);
    if (!keepMessage) {
      setSyncMessage(null);
    }
    setIsProcessing(false);
    setIsExtracted(false);

    const uploadInput = document.getElementById('ticket-upload-input') as HTMLInputElement | null;
    if (uploadInput) {
      uploadInput.value = '';
    }
  };

  const startProcessing = (name: string) => {
    setFileName(name);
    setIsProcessing(true);
    setSyncMessage(null);
    setExtractedData(null);
    setIsExtracted(false);

    processingTimer.current = setTimeout(() => {
      const destinations = ['Rig 18 / Well 4A', 'Rig 22 / Pad 12', 'Rig 7 / North Spur', 'Rig 31 / West Delta'];
      const materials = ['Fresh Water', 'Crude Oil', 'Produced Water', 'Silica Sand'];
      const tonnages = ['128 BBL', '342 BBL', '860 BBL', '1.2 MT', '2.4 MT'];

      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const materialType = materials[Math.floor(Math.random() * materials.length)];
      const volume = tonnages[Math.floor(Math.random() * tonnages.length)];
      const ticketId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const confirmationCode = `BMS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const confidence = `${95 + Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}% Accuracy`;

      const extracted: ExtractedTicketData = {
        ticketId,
        materialType,
        volume,
        destination,
        confidence,
        confirmationCode,
      };

      const newShipment = generateShipmentFromExtraction(extracted);
      setIsProcessing(false);
      setExtractedData(extracted);
      setIsExtracted(true);
      // Keep the shipment pending until the user confirms the sync action.
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('pending-shipment', JSON.stringify(newShipment));
      }
    }, 2000);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!acceptedMimeTypes.includes(file.type)) {
      return;
    }

    startProcessing(file.name);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleUploadClick = () => {
    document.getElementById('ticket-upload-input')?.click();
  };

  const handleConfirm = () => {
    if (!extractedData) {
      return;
    }

    const pendingShipment = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('pending-shipment')
      : null;

    const shipment = pendingShipment
      ? (JSON.parse(pendingShipment) as Shipment)
      : generateShipmentFromExtraction(extractedData);

    onExtractedShipment(shipment);
    setSyncMessage('Shipment synced to the persistent history list.');
    resetScanner(true);

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('pending-shipment');
    }
  };

  const isReady = !!extractedData && !isProcessing;

  return (
    <section className="rounded-[2rem] border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">AI Core Module</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Intelligent Load Verification</h2>
          <p className="mt-2 text-slate-400">
            Upload a ticket scan to simulate OCR and AI extraction. Review the details before syncing to the platform.
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 px-6 py-12 text-center transition ${
            isDragging
              ? 'border-cyan-400 bg-slate-900/90'
              : 'border-slate-700 bg-slate-950/80'
          }`}
        >
          <input
            id="ticket-upload-input"
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <p className="text-sm font-medium text-slate-300">Drag & drop delivery ticket files here</p>
          <p className="mt-2 text-xs text-slate-500">PNG, JPG, or PDF</p>
          <button
            type="button"
            onClick={handleUploadClick}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-cyan-500 bg-slate-950 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
          >
            Browse files
          </button>
        </div>

        {isProcessing && (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-center text-slate-300 shadow-inner shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Processing</p>
            <p className="mt-3 text-lg font-semibold text-white">Analyzing ticket with OCR & AI...</p>
          </div>
        )}

        {extractedData && (
          <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-slate-950/20 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Ticket ID</p>
                <p className="mt-2 text-lg font-semibold text-white">{extractedData.ticketId}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Volume / Quantity</p>
                <p className="mt-2 text-lg font-semibold text-white">{extractedData.volume}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Confirmation Code</p>
                <p className="mt-2 text-lg font-semibold text-cyan-300">{extractedData.confirmationCode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Material Type</p>
                <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-inner shadow-slate-950/10">
                  <select
                    value={extractedData.materialType}
                    onChange={(event) =>
                      setExtractedData({ ...extractedData, materialType: event.target.value })
                    }
                    className="w-full bg-transparent text-white outline-none"
                  >
                    {materialOptions.map((option) => (
                      <option key={option} value={option} className="bg-slate-950 text-slate-100">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Well / Destination Site</p>
                <p className="mt-2 text-lg font-semibold text-white">{extractedData.destination}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Confidence Score</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">{extractedData.confidence}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => resetScanner()}
            className="rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Discard / Retake
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isReady}
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-700 hover:bg-cyan-400"
          >
            Confirm & Sync with Database
          </button>
        </div>

        {syncMessage && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            {syncMessage}
          </div>
        )}

        {fileName && !isProcessing && !extractedData && (
          <p className="text-sm text-slate-400">Uploaded file: {fileName}</p>
        )}
      </div>
    </section>
  );
}
