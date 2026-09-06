'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle2, Upload, Sparkles } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';

interface CameraViewfinderProps {
  onCapture: (compressedDataUrl: string) => void;
  capturedImage: string | null;
  onRetake: () => void;
  title?: string;
  guideText?: string;
}

export function CameraViewfinder({
  onCapture,
  capturedImage,
  onRetake,
  title = 'Live Facial Verification',
  guideText = 'Position face inside the oval guide',
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);

  // Play synthesized shutter sound via Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted without gesture
    }
  };

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam mediaDevices API is not supported in this browser.');
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage, startCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const captureSnapshot = async () => {
    if (!videoRef.current) return;

    setFlash(true);
    playShutterSound();
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const compressed = await compressImage(rawDataUrl, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.75,
      });

      onCapture(compressed);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.75 });
    onCapture(compressed);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-blue-600" />
          {title}
        </span>
        {!capturedImage && isCameraActive && (
          <button
            type="button"
            onClick={toggleCameraFacing}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 text-[11px] font-semibold transition"
          >
            <RefreshCw className="w-3 h-3" />
            Switch ({facingMode === 'user' ? 'Front' : 'Rear'})
          </button>
        )}
      </div>

      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center">
        {/* Flash Effect */}
        {flash && <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />}

        {capturedImage ? (
          /* Captured Preview */
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured biometric preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              Verified Biometric Snapshot
            </div>
            <div className="absolute bottom-3 right-3">
              <button
                type="button"
                onClick={onRetake}
                className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 rounded-xl shadow-lg border border-slate-200 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Retake Photo
              </button>
            </div>
          </div>
        ) : isCameraActive ? (
          /* Live Stream */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Oval Face Guide Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 sm:w-56 h-64 sm:h-72 border-2 border-dashed border-cyan-300/80 rounded-[50%] shadow-[0_0_25px_rgba(6,182,212,0.4)] flex flex-col items-center justify-end pb-3">
                {/* Scanning Radar Line */}
                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-scan-line" />
                <span className="text-[10px] font-bold text-cyan-900 bg-cyan-100/90 px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
                  {guideText}
                </span>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-900 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE SENSOR
            </div>

            {/* Snap Button Overlay */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
              <button
                type="button"
                onClick={captureSnapshot}
                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-xl hover:scale-105 active:scale-95 transition"
                aria-label="Capture attendance photo"
              >
                <div className="w-11 h-11 rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Camera Unavailable / Fallback in clean bright container */
          <div className="p-6 text-center space-y-4 max-w-sm bg-slate-50 rounded-2xl m-4 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {cameraError || 'Camera stream is unavailable'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Please allow camera access in your browser or upload a captured photo.
              </p>
            </div>
            <div className="flex items-center justify-center pt-2">
              <label className="cursor-pointer px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Upload Photo Snapshot</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
