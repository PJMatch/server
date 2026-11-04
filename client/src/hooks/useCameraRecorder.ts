import { useEffect, useRef, useState, useCallback } from "react";

interface UseCameraRecorderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onRecordingComplete: (url: string) => void;
}

export function useCameraRecorder({
  videoRef,
  onRecordingComplete
}: UseCameraRecorderProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isRecordingLoopActiveRef = useRef<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "user",
          },
          audio: false,
        });

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || !videoRef.current) return;

    chunksRef.current = [];

    const videoEl = videoRef.current;
    const vWidth = videoEl.videoWidth > 0 ? videoEl.videoWidth : 1920;
    const vHeight = videoEl.videoHeight > 0 ? videoEl.videoHeight : 1080;
    const size = Math.min(vWidth, vHeight);
    const sx = Math.floor((vWidth - size) / 2);
    const sy = Math.floor((vHeight - size) / 2);

    let canvas = recordCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      recordCanvasRef.current = canvas;
    }
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    isRecordingLoopActiveRef.current = true;
    let animId: number | null = null;

    const renderSquareFrame = () => {
      if (!isRecordingLoopActiveRef.current) return;
      if (ctx && videoEl) {
        ctx.save();
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, size, size);
        ctx.restore();
      }
      animId = requestAnimationFrame(renderSquareFrame);
    };

    if (ctx) {
      ctx.save();
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, size, size);
      ctx.restore();
    }
    animId = requestAnimationFrame(renderSquareFrame);

    const canvasStream = canvas.captureStream(30);

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
    }

    const options = {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 4000000
    };

    const recorder = new MediaRecorder(canvasStream, options);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      isRecordingLoopActiveRef.current = false;
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      canvasStream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      onRecordingComplete(url);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  }, [videoRef, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    isRecordingLoopActiveRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    isRecordingLoopActiveRef.current = false;
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      videoRef.current.controls = false;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      if (streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [videoRef, recordedVideoUrl]);

  return {
    streamRef,
    recordedVideoUrl,
    setRecordedVideoUrl,
    startRecording,
    stopRecording,
    resetRecording
  };
}
