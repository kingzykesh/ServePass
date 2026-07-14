"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import toast from "react-hot-toast";
import {
  Camera,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Focus,
  ImagePlus,
  Loader2,
  RefreshCcw,
  ScanLine,
  Square,
  TriangleAlert,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { verifyTicket } from "@/services/tickets";

type VerificationStatus =
  | "idle"
  | "success"
  | "used"
  | "error";

type ScannerControls = {
  stop: () => void;
};

type ExtendedCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  focusMode?: string[];
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
};

type ExtendedSettings = MediaTrackSettings & {
  zoom?: number;
};

type ExtendedConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean;
  focusMode?: string;
  zoom?: number;
};

function extractUuid(value: string): string {
  const cleanedValue = value.trim();

  const uuidMatch = cleanedValue.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );

  return uuidMatch?.[0] ?? cleanedValue;
}

function getCameraErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : String(error ?? "");

  const message = raw.toLowerCase();

  if (
    message.includes("notallowed") ||
    message.includes("permission") ||
    message.includes("denied")
  ) {
    return "Camera access was denied. Allow camera permission for ServePass and reload the page.";
  }

  if (
    message.includes("notreadable") ||
    message.includes("could not start video") ||
    message.includes("trackstart") ||
    message.includes("video source")
  ) {
    return "The camera is busy or unavailable. Close Camera, WhatsApp, Instagram and other camera apps, then reload ServePass.";
  }

  if (
    message.includes("notfound") ||
    message.includes("device not found")
  ) {
    return "No usable camera was found on this device.";
  }

  if (
    message.includes("overconstrained") ||
    message.includes("constraint")
  ) {
    return "The selected camera settings are unsupported on this device.";
  }

  return raw || "Unable to start the camera.";
}

function playScannerSound(
  type: "VALID" | "USED" | "REJECTED"
) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    const playTone = (
      frequency: number,
      duration: number,
      delay = 0,
      oscillatorType: OscillatorType = "square"
    ) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      const startTime = audioContext.currentTime + delay;
      const endTime = startTime + duration;

      oscillator.type = oscillatorType;
      oscillator.frequency.setValueAtTime(
        frequency,
        startTime
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      gain.gain.setValueAtTime(1, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        endTime
      );

      oscillator.start(startTime);
      oscillator.stop(endTime);
    };

    void audioContext.resume();

    if (type === "VALID") {
      playTone(1400, 0.16);
      playTone(1850, 0.18, 0.17);
    }

    if (type === "USED") {
      playTone(800, 0.16);
      playTone(800, 0.16, 0.22);
      playTone(800, 0.16, 0.44);
    }

    if (type === "REJECTED") {
      playTone(210, 0.7, 0, "sawtooth");
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1600);
  } catch (error) {
    console.warn("Unable to play scanner sound:", error);
  }
}

export default function QRVerifier() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const processingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [processingImage, setProcessingImage] =
    useState(false);

  const [status, setStatus] =
    useState<VerificationStatus>("idle");

  const [result, setResult] = useState<any>(null);

  const [message, setMessage] = useState(
    "Start the scanner and place the full printed QR code inside the frame."
  );

  const [torchSupported, setTorchSupported] =
    useState(false);

  const [torchEnabled, setTorchEnabled] =
    useState(false);

  const [zoomSupported, setZoomSupported] =
    useState(false);

  const [zoom, setZoom] = useState(1);
  const [minimumZoom, setMinimumZoom] = useState(1);
  const [maximumZoom, setMaximumZoom] = useState(1);
  const [zoomStep, setZoomStep] = useState(0.25);

  function getVideoTrack(): MediaStreamTrack | null {
    const stream = videoRef.current
      ?.srcObject as MediaStream | null;

    return stream?.getVideoTracks()?.[0] ?? null;
  }

  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch (error) {
      console.warn("ZXing stop warning:", error);
    }

    controlsRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;

    stream?.getTracks().forEach((track) => {
      track.stop();
    });

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setScanning(false);
    setStarting(false);
    setTorchEnabled(false);
    setTorchSupported(false);
    setZoomSupported(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
      readerRef.current = null;
    };
  }, [stopScanner]);

  async function inspectCameraCapabilities() {
    const track = getVideoTrack();

    if (!track) return;

    try {
      const capabilities =
        track.getCapabilities() as ExtendedCapabilities;

      const settings =
        track.getSettings() as ExtendedSettings;

      if (capabilities.torch === true) {
        setTorchSupported(true);
      }

      if (capabilities.zoom) {
        const min = Number(capabilities.zoom.min ?? 1);
        const max = Number(capabilities.zoom.max ?? 1);
        const step = Number(capabilities.zoom.step ?? 0.25);

        setMinimumZoom(min);
        setMaximumZoom(max);
        setZoomStep(step > 0 ? step : 0.25);
        setZoomSupported(max > min);

        const currentZoom = Number(settings.zoom ?? min);
        setZoom(currentZoom);

        /*
         * Apply only gentle zoom. Excessive digital zoom
         * can make an already-small printed QR less sharp.
         */
        const preferredZoom = Math.min(
          max,
          Math.max(min, currentZoom, 1.15)
        );

        if (preferredZoom !== currentZoom) {
          await track.applyConstraints({
            advanced: [
              {
                zoom: preferredZoom,
              } as ExtendedConstraintSet,
            ],
          });

          setZoom(preferredZoom);
        }
      }

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        await track.applyConstraints({
          advanced: [
            {
              focusMode: "continuous",
            } as ExtendedConstraintSet,
          ],
        });
      }
    } catch (error) {
      console.warn(
        "Camera focus, zoom or torch controls are unavailable:",
        error
      );
    }
  }

  async function handleDecodedValue(decodedValue: string) {
    if (processingRef.current) return;

    processingRef.current = true;
    stopScanner();

    const ticketUuid = extractUuid(decodedValue);

    try {
      setMessage("Checking ticket...");

      const data = await verifyTicket(ticketUuid);

      setResult(data);
      setStatus("success");
      setMessage("Ticket verified successfully.");

      playScannerSound("VALID");
      toast.success("Ticket verified successfully");
    } catch (error: any) {
      const responseMessage =
        error?.response?.data?.message ??
        "Verification failed";

      const responseData =
        error?.response?.data?.data ?? null;

      const alreadyUsed = responseMessage
        .toLowerCase()
        .includes("already used");

      setResult(responseData);
      setMessage(responseMessage);

      if (alreadyUsed) {
        setStatus("used");
        playScannerSound("USED");
      } else {
        setStatus("error");
        playScannerSound("REJECTED");
      }

      toast.error(responseMessage);
    } finally {
      processingRef.current = false;
    }
  }

  async function startScanner() {
    if (starting || scanning) return;

    const videoElement = videoRef.current;

    if (!videoElement) {
      toast.error("Scanner video is not ready");
      return;
    }

    try {
      stopScanner();

      setStarting(true);
      setStatus("idle");
      setResult(null);
      setMessage("Starting the rear camera...");

      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
          frameRate: {
            ideal: 24,
            max: 30,
          },
        },
      };

      const controls = await reader.decodeFromConstraints(
        constraints,
        videoElement,
        (decodedResult) => {
          if (!decodedResult || processingRef.current) return;

          const decodedText = decodedResult.getText();

          if (decodedText) {
            void handleDecodedValue(decodedText);
          }
        }
      );

      controlsRef.current = controls;
      setScanning(true);
      setStarting(false);

      setMessage(
        "Hold the armband steady. Start farther away, then move closer slowly until the QR becomes sharp."
      );

      window.setTimeout(() => {
        void inspectCameraCapabilities();
      }, 900);
    } catch (error) {
      console.error("ZXing camera start failed:", error);

      stopScanner();

      const friendlyMessage =
        getCameraErrorMessage(error);

      setStatus("error");
      setMessage(friendlyMessage);

      playScannerSound("REJECTED");
      toast.error(friendlyMessage);
    }
  }

  async function changeZoom(nextZoom: number) {
    const track = getVideoTrack();

    if (!track || !zoomSupported) return;

    const safeZoom = Math.min(
      maximumZoom,
      Math.max(minimumZoom, nextZoom)
    );

    try {
      await track.applyConstraints({
        advanced: [
          {
            zoom: safeZoom,
          } as ExtendedConstraintSet,
        ],
      });

      setZoom(safeZoom);
    } catch (error) {
      console.warn("Camera zoom failed:", error);
      toast.error("Zoom is unavailable on this phone");
    }
  }

  async function toggleTorch() {
    const track = getVideoTrack();

    if (!track || !torchSupported) return;

    const nextState = !torchEnabled;

    try {
      await track.applyConstraints({
        advanced: [
          {
            torch: nextState,
          } as ExtendedConstraintSet,
        ],
      });

      setTorchEnabled(nextState);
    } catch (error) {
      console.warn("Torch control failed:", error);
      toast.error("Torch is unavailable on this phone");
    }
  }

  async function refocusCamera() {
    const track = getVideoTrack();

    if (!track) return;

    try {
      const capabilities =
        track.getCapabilities() as ExtendedCapabilities;

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("single-shot")
      ) {
        await track.applyConstraints({
          advanced: [
            {
              focusMode: "single-shot",
            } as ExtendedConstraintSet,
          ],
        });

        window.setTimeout(() => {
          if (
            capabilities.focusMode?.includes("continuous")
          ) {
            void track.applyConstraints({
              advanced: [
                {
                  focusMode: "continuous",
                } as ExtendedConstraintSet,
              ],
            });
          }
        }, 650);

        toast.success("Camera refocused");
        return;
      }

      if (zoomSupported) {
        const originalZoom = zoom;

        const temporaryZoom = Math.min(
          maximumZoom,
          zoom + zoomStep
        );

        await changeZoom(temporaryZoom);

        window.setTimeout(() => {
          void changeZoom(originalZoom);
        }, 400);

        toast.success("Focus refreshed");
        return;
      }

      toast(
        "Move the phone away slightly, then approach the QR slowly"
      );
    } catch (error) {
      console.warn("Refocus failed:", error);

      toast(
        "Move the phone away slightly, then approach the QR slowly"
      );
    }
  }

  async function scanUploadedImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || processingImage) return;

    let objectUrl = "";

    try {
      setProcessingImage(true);
      setStatus("idle");
      setResult(null);
      setMessage("Reading QR code from image...");

      stopScanner();

      objectUrl = URL.createObjectURL(file);

      const reader =
        readerRef.current ?? new BrowserQRCodeReader();

      readerRef.current = reader;

      const decodedResult =
        await reader.decodeFromImageUrl(objectUrl);

      await handleDecodedValue(decodedResult.getText());
    } catch (error) {
      console.error("Image QR decoding failed:", error);

      setStatus("error");
      setMessage(
        "No readable QR code was found in that image. Retake the photo closer and keep the QR square."
      );

      playScannerSound("REJECTED");
      toast.error("No readable QR code found");
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setProcessingImage(false);
    }
  }

  const resultCardClass =
    status === "success"
      ? "border-green-200 bg-green-50"
      : status === "used"
        ? "border-amber-200 bg-amber-50"
        : status === "error"
          ? "border-red-200 bg-red-50"
          : "border-gray-100 bg-white";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="relative min-h-[390px] overflow-hidden rounded-3xl bg-slate-950">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={`h-full min-h-[390px] w-full object-cover ${
              scanning ? "block" : "hidden"
            }`}
          />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="rounded-full bg-white/10 p-5">
                <Camera size={40} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                Scanner is ready
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
                Start the rear camera and place the complete
                printed QR inside the frame.
              </p>
            </div>
          )}

          {scanning && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-0 top-0 h-14 w-14 border-l-4 border-t-4 border-white" />
                <span className="absolute right-0 top-0 h-14 w-14 border-r-4 border-t-4 border-white" />
                <span className="absolute bottom-0 left-0 h-14 w-14 border-b-4 border-l-4 border-white" />
                <span className="absolute bottom-0 right-0 h-14 w-14 border-b-4 border-r-4 border-white" />

                <div className="absolute left-1/2 top-1/2 h-px w-[92%] -translate-x-1/2 bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              </div>

              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                Hold the QR steady
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-medium leading-6 text-gray-600">
          {message}
        </p>

        {scanning && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={refocusCamera}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-800"
            >
              <Focus size={17} />
              Refocus
            </button>

            <button
              type="button"
              disabled={!zoomSupported}
              onClick={() =>
                changeZoom(zoom - zoomStep)
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut size={17} />
              Zoom out
            </button>

            <button
              type="button"
              disabled={!zoomSupported}
              onClick={() =>
                changeZoom(zoom + zoomStep)
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn size={17} />
              Zoom in
            </button>

            <button
              type="button"
              disabled={!torchSupported}
              onClick={toggleTorch}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                torchEnabled
                  ? "border-amber-300 bg-amber-100 text-amber-900"
                  : "border-gray-200 bg-white text-gray-800"
              }`}
            >
              {torchEnabled ? (
                <FlashlightOff size={17} />
              ) : (
                <Flashlight size={17} />
              )}

              {torchEnabled ? "Torch off" : "Torch"}
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={startScanner}
            disabled={scanning || starting}
            className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <ScanLine size={18} />
            )}

            {starting
              ? "Starting..."
              : scanning
                ? "Scanner active"
                : "Start Scanner"}
          </button>

          <button
            type="button"
            onClick={stopScanner}
            disabled={!scanning && !starting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-black text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Square size={16} />
            Stop
          </button>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={processingImage}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-black text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processingImage ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <ImagePlus size={18} />
            )}

            Scan Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={scanUploadedImage}
          />
        </div>
      </Card>

      <Card
        className={`border p-6 transition-colors ${resultCardClass}`}
      >
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Verification Result
        </p>

        {status === "idle" && (
          <div className="mt-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ScanLine size={28} />
            </div>

            <h2 className="mt-5 text-3xl font-black text-gray-950">
              Ready to scan
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Begin around 20–30 cm from the armband,
              keep it flat and approach slowly.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-5 space-y-3">
            <CheckCircle2
              size={48}
              className="text-green-700"
            />

            <h2 className="text-4xl font-black text-green-700">
              Verified
            </h2>

            <p className="text-2xl font-black text-gray-950">
              {result?.holder_name}
            </p>

            <p className="font-semibold text-gray-700">
              {result?.event}
            </p>

            <p className="text-sm text-gray-600">
              {result?.meal_session}
            </p>

            <p className="text-sm font-bold text-green-700">
              {result?.ticket_code}
            </p>
          </div>
        )}

        {status === "used" && (
          <div className="mt-5 space-y-3">
            <TriangleAlert
              size={48}
              className="text-amber-700"
            />

            <h2 className="text-4xl font-black text-amber-700">
              Already Used
            </h2>

            <p className="text-lg font-black text-gray-950">
              {result?.ticket?.holder_name ??
                result?.holder_name ??
                "Ticket holder"}
            </p>

            <p className="text-sm text-gray-700">
              This ticket has already been verified.
            </p>

            {result?.used_at && (
              <p className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-amber-900">
                Used at: {result.used_at}
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 space-y-3">
            <XCircle
              size={48}
              className="text-red-700"
            />

            <h2 className="text-4xl font-black text-red-700">
              Rejected
            </h2>

            <p className="text-sm leading-6 text-gray-700">
              {message}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={startScanner}
          disabled={scanning || starting}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw size={17} />
          Scan Next Ticket
        </button>
      </Card>
    </div>
  );
}