"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    stopCamera();
    setReady(false);
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("이 브라우저에서는 카메라 촬영을 지원하지 않습니다.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (caught) {
      const denied = caught instanceof DOMException && caught.name === "NotAllowedError";
      setError(
        denied
          ? "카메라 권한이 차단되었습니다. 브라우저 주소창의 카메라 권한을 허용해주세요."
          : caught instanceof Error
            ? caught.message
            : "카메라를 실행하지 못했습니다."
      );
    }
  };

  useEffect(() => {
    void startCamera();
    return stopCamera;
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sourceX = (video.videoWidth - size) / 2;
    const sourceY = (video.videoHeight - size) / 2;
    context.translate(size, 0);
    context.scale(-1, 1);
    context.drawImage(video, sourceX, sourceY, size, size, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamera();
      onCapture(new File([blob], `health-avatar-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center" role="dialog" aria-modal="true" aria-label="얼굴 사진 촬영">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-4 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="text-lg font-extrabold text-[#1F2937]">건강이 얼굴 촬영</h2><p className="text-sm text-gray-500">얼굴을 원 안에 맞추고 정면을 바라보세요.</p></div>
          <button onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100" aria-label="카메라 닫기"><X size={20} /></button>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#10291d]">
          <video ref={videoRef} playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
          <div className="pointer-events-none absolute inset-[10%] rounded-full border-4 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.18)]" />
          {!ready && !error && <div className="absolute inset-0 flex items-center justify-center text-center text-white"><div><Camera className="mx-auto mb-2 animate-pulse" /><p className="font-semibold">카메라를 준비하고 있어요</p></div></div>}
          {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white"><div><CameraOff className="mx-auto mb-3" size={36} /><p className="font-semibold leading-relaxed">{error}</p></div></div>}
        </div>

        <div className="mt-4 flex gap-2">
          {error ? (
            <button onClick={() => void startCamera()} className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F5A3A] font-bold text-white"><RotateCcw size={19} />다시 시도</button>
          ) : (
            <button onClick={takePhoto} disabled={!ready} className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] text-lg font-bold text-white disabled:opacity-50"><Camera size={21} />이 모습으로 촬영</button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-gray-400">촬영 영상은 저장되지 않으며 캡처한 사진 한 장만 기기 안에서 변환됩니다.</p>
      </div>
    </div>
  );
}
