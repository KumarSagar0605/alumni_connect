// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';

interface PhoneDetectionResult {
  cameraActive: boolean;
  phoneDetected: boolean;
  phoneDetectionCount: number;
  cameraError: string | null;
  stream: MediaStream | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function usePhoneDetection(): PhoneDetectionResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [phoneDetectionCount, setPhoneDetectionCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startDetectionLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelRef.current) return;
      if (videoRef.current.readyState < 2) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      try {
        const predictions = await modelRef.current.detect(canvasRef.current);
        const phoneFound = predictions.some(
          (p: any) =>
            (p.class === 'cell phone' || p.class === 'mobile phone') &&
            p.score > 0.45
        );
        if (phoneFound) {
          setPhoneDetected(true);
          setPhoneDetectionCount((prev) => prev + 1);
        }
      } catch {}
    }, 3000);
  }, []);

  const requestCamera = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
    });
    streamRef.current = mediaStream;
    setStream(mediaStream);

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvasRef.current = canvas;

    setCameraActive(true);
    setCameraError(null);

    // Load COCO-SSD (lazy, non-blocking for camera startup)
    if (!modelRef.current) {
      try {
        const cocossd = await import('@tensorflow-models/coco-ssd');
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        modelRef.current = await cocossd.load({ base: 'lite' });
        startDetectionLoop();
      } catch (err) {
        console.warn('COCO-SSD load failed:', err);
      }
    } else {
      startDetectionLoop();
    }
  }, [startDetectionLoop]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.parentNode === document.body) {
      document.body.removeChild(videoRef.current);
    }
    videoRef.current = null;
    setCameraActive(false);
    setStream(null);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (modelRef.current) {
        modelRef.current.dispose?.();
        modelRef.current = null;
      }
    };
  }, [stopCamera]);

  return {
    cameraActive,
    phoneDetected,
    phoneDetectionCount,
    cameraError,
    stream,
    requestCamera,
    stopCamera,
  };
}
