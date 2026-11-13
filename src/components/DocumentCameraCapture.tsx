'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Check, ShieldAlert, AlertCircle, FileText, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DocumentCameraCaptureProps {
  onCapture: (base64Image: string, mimeType: string) => void;
  isAnalyzing?: boolean;
}

export function DocumentCameraCapture({ onCapture, isAnalyzing = false }: DocumentCameraCaptureProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or switch camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported on this device/browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access failed, falling back to file upload:', err);
      setCameraError(err.message || 'Camera permission denied or camera not found.');
      setActiveTab('upload');
    }
  }, [facingMode]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    }
    return () => {
      if (videoEl?.srcObject) {
        const currentStream = videoEl.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab, capturedImage, startCamera]);

  // Capture current video frame to canvas
  const handleShutter = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64 = dataUrl.split(',')[1];
      setCapturedImage(dataUrl);

      // Stop camera stream to preserve battery
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  // Handle manual file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    const base64 = capturedImage.split(',')[1];
    onCapture(base64, 'image/jpeg');
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('camera');
            setCapturedImage(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-[#FF671F] shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>कैमरा स्कैन / Live Camera</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setCapturedImage(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-[#FF671F] shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>फ़ाइल अपलोड / File Upload</span>
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative bg-slate-950 aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          // Captured Preview Mode
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured Document"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>फ़ोटो तैयार / Captured</span>
            </div>
          </div>
        ) : activeTab === 'camera' ? (
          // Live Camera Stream
          <div className="relative w-full h-full flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white max-w-sm">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-sm font-medium">{cameraError}</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-4 py-2 bg-[#FF671F] text-white rounded-xl text-xs font-semibold"
                >
                  फ़ाइल अपलोड का उपयोग करें
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Document Bounding Box Frame Overlay */}
                <div className="absolute inset-6 sm:inset-10 border-2 border-white/70 border-dashed rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div className="flex justify-between items-start text-[10px] sm:text-xs text-white/90 font-medium tracking-wider uppercase">
                    <span>राशन कार्ड / Land Passbook Frame</span>
                    <span>AI Alignment</span>
                  </div>
                  <div className="text-center text-xs text-white/80 font-medium bg-black/40 py-1 px-3 rounded-full backdrop-blur-sm mx-auto">
                    दस्तावेज़ को फ्रेम के अंदर सीधा रखें
                  </div>
                </div>

                {/* Flip camera control */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                  aria-label="Flip Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          // Upload File Fallback Dropzone
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-900 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <div className="p-4 bg-white/10 rounded-full mb-3 text-white">
              <Upload className="w-10 h-10" />
            </div>
            <p className="text-white font-medium text-sm sm:text-base">
              दस्तावेज़ की तस्वीर चुनें या खींचें
            </p>
            <p className="text-slate-400 text-xs mt-1">
              PNG, JPG, JPEG समर्थित (अधिकतम 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Aadhaar Privacy Shield Notice */}
      <div className="p-3 bg-amber-50 border-t border-amber-200/60 flex items-center gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <span className="font-bold">आधार गोपनीयता सुरक्षा:</span> किसी भी 12-अंक के आधार नंबर को AI विश्लेषण से पूर्व स्वतः ही <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">XXXX-XXXX-1234</code> के रूप में मास्क कर दिया जाता है।
        </p>
      </div>

      {/* Action Controls */}
      <div className="p-4 bg-slate-50 flex items-center justify-between gap-4">
        {capturedImage ? (
          <>
            <button
              type="button"
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>दोबारा लें / Retake</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white font-bold text-sm shadow-md hover:opacity-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <span>AI विश्लेषण जारी है...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>दस्तावेज़ जांचें / Analyze</span>
                </>
              )}
            </button>
          </>
        ) : activeTab === 'camera' && !cameraError ? (
          <div className="w-full flex justify-center py-1">
            <button
              type="button"
              onClick={handleShutter}
              className="w-16 h-16 rounded-full border-4 border-white bg-[#FF671F] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Capture Photo"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>गैलरी से चुनें / Browse File</span>
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
