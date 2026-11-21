import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, FileText, UploadCloud, AlertCircle, RefreshCw, Edit3, ShieldCheck, Sparkles } from 'lucide-react';
import { uploadPrescription } from '../../services/api';

export function UploadScreen() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('Uploading...');
  const [error, setError] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check size limit: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('File exceeds 10MB limit (Payload Too Large). Please upload a smaller file.');
      return;
    }

    // Check file type: image or PDF
    const isValidType =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.name.match(/\.(jpe?g|png|webp|pdf)$/i);

    if (!isValidType) {
      setError('Unsupported file type. Please upload a JPG, PNG image or a PDF document.');
      return;
    }

    setLastFile(file);
    setIsProcessing(true);
    setProcessingStage('Uploading prescription...');
    setError(null);

    const stageTimer = setTimeout(() => {
      setProcessingStage('Reading prescription with AI...');
    }, 450);

    try {
      const draft = await uploadPrescription(file);
      clearTimeout(stageTimer);
      navigate(`/review/${encodeURIComponent(draft.prescription_id)}`, {
        state: { draft },
      });
    } catch (err) {
      clearTimeout(stageTimer);
      setError(
        err?.response?.data?.detail ||
          err.message ||
          'Extraction failed (422 Unprocessable Entity). Text could not be parsed.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerUpload = (captureMode = null) => {
    if (!fileInputRef.current) return;
    if (captureMode) {
      fileInputRef.current.setAttribute('capture', captureMode);
    } else {
      fileInputRef.current.removeAttribute('capture');
    }
    fileInputRef.current.click();
  };

  const handleManualEntry = () => {
    const manualDraft = {
      prescription_id: `rx-manual-${Date.now().toString().slice(-4)}`,
      patient_id: 'demo-patient',
      status: 'draft',
      source_filename: lastFile ? lastFile.name : 'manual-entry.pdf',
      prescribed_on: new Date().toISOString().split('T')[0],
      medicines: [{ name: '', dose: '', frequency: '', source: 'prescription' }],
      needs_review: true,
      filePreviewUrl: lastFile ? URL.createObjectURL(lastFile) : null,
    };
    navigate(`/review/${manualDraft.prescription_id}`, { state: { draft: manualDraft } });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Welcome Card with Cohesive Brand Blue Gradient */}
      <div className="bg-gradient-to-br from-sky-800 to-slate-900 rounded-3xl p-5 text-white shadow-md">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-700/60 text-sky-200 border border-sky-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          MedVigil AI Scanner
        </div>
        <h2 className="text-xl font-extrabold tracking-tight font-heading">Prescription Intake</h2>
        <p className="text-xs text-sky-100/90 mt-1 leading-relaxed font-medium">
          Snap a photo of your prescription. Our AI reads the medicines for your review before confirming.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-rose-950">Extraction Issue</strong>
              <span className="font-medium">{error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => lastFile && handleFileUpload(lastFile)}
              className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={handleManualEntry}
              className="inline-flex items-center gap-1 bg-white border border-rose-300 text-rose-800 font-bold px-3 py-1.5 rounded-xl transition hover:bg-rose-100/50"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Enter Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing ? (
        <div className="bg-white border-2 border-sky-500/30 rounded-3xl p-8 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto animate-pulse border border-sky-100">
            <UploadCloud className="w-8 h-8 text-sky-600 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-heading">{processingStage}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Please wait while medication details are extracted.</p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-2/3 h-full bg-sky-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onFileInputChange}
          />

          {/* Main Upload Dropzone */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => triggerUpload()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
              dragActive ? 'border-sky-500 bg-sky-50/50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-sky-50/40 hover:border-sky-400'
            }`}
          >
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center mx-auto mb-2 text-sky-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 font-heading">Tap to Upload Prescription</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Supports JPG, PNG images or PDF documents (up to 10MB)</p>
          </div>

          {/* 3 Unified Action Buttons with Primary Palette */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Camera */}
            <button
              type="button"
              onClick={() => triggerUpload('environment')}
              className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white p-3 min-h-[56px] rounded-2xl flex flex-col items-center justify-center text-center shadow-xs transition touch-manipulation"
            >
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold leading-tight">Camera</span>
            </button>

            {/* Gallery */}
            <button
              type="button"
              onClick={() => triggerUpload()}
              className="bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 text-slate-800 p-3 min-h-[56px] rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs transition touch-manipulation"
            >
              <ImageIcon className="w-5 h-5 text-sky-600 mb-1" />
              <span className="text-xs font-bold leading-tight">Gallery</span>
            </button>

            {/* PDF */}
            <button
              type="button"
              onClick={() => triggerUpload()}
              className="bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 text-slate-800 p-3 min-h-[56px] rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs transition touch-manipulation"
            >
              <FileText className="w-5 h-5 text-sky-600 mb-1" />
              <span className="text-xs font-bold leading-tight">PDF Doc</span>
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="font-medium">
          <strong className="text-slate-800">Verification Protocol:</strong> Extracted medicines will be presented in an editable draft. Nothing is confirmed without your review.
        </p>
      </div>
    </div>
  );
}
