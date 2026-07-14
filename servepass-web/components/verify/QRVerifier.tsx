"use client";

import { useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import toast from "react-hot-toast";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  Focus,
  RotateCcw,
  ScanLine,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { verifyTicket } from "@/services/tickets";

type VerificationStatus =
  | "idle"
  | "success"
  | "used"
  | "error";

type ScannerCapabilities = MediaTrackCapabilities & {
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
  focusMode?: string[];
  torch?: boolean;
};

type AdvancedCameraConstraint = MediaTrackConstraintSet & {
  zoom?: number;
  focusMode?: string;
  torch?: boolean;
};

function extractUuid(value: string): string {
  const cleanedValue = value.trim();

  const uuidMatch = cleanedValue.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );

  return uuidMatch ? uuidMatch[0] : cleanedValue;
}

function playScannerSound(
  sound: "VALID" | "USED" | "REJECTED"
) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    function tone(
      frequency: number,
      duration: number,
      delay = 0,
      oscillatorType: OscillatorType = "square"
    ) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      const startAt = audioContext.currentTime + delay;
      const endAt = startAt + duration;

      oscillator.type = oscillatorType;
      oscillator.frequency.setValueAtTime(frequency, startAt);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      // 1 is the maximum Web Audio gain.
      gain.gain.setValueAtTime(1, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, endAt);

      oscillator.start(startAt);
      oscillator.stop(endAt);
    }

    void audioContext.resume();

    if (sound === "VALID") {
      tone(1450, 0.16);
      tone(1750, 0.18, 0.17);
    }

    if (sound === "USED") {
      tone(850, 0.16);
      tone(850, 0.16, 0.22);
      tone(850, 0.16, 0.44);
    }

    if (sound === "REJECTED") {
      tone(220, 0.65, 0, "sawtooth");
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1500);
  } catch (error) {
    console.warn("Scanner sound could not play:", error);
  }
}

export default function QRVerifier() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [status, setStatus] =
    useState<VerificationStatus>("idle");

  const [message, setMessage] = useState(
    "Position the printed QR inside the frame."
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

  async function stopScanner() {
  const scanner = scannerRef.current;

  if (!scanner) {
    setScanning(false);
    setStarting(false);
    return;
  }

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch (error) {
    console.warn("Scanner stop warning:", error);
  }

  try {
    scanner.clear();
  } catch (error) {
    console.warn("Scanner clear warning:", error);
  }

  scannerRef.current = null;
  processingRef.current = false;

  setScanning(false);
  setStarting(false);
  setTorchEnabled(false);
  setTorchSupported(false);
  setZoomSupported(false);
}

  async function applyCameraEnhancements(
    scanner: Html5Qrcode
  ) {
    try {
      const capabilities =
        scanner.getRunningTrackCapabilities() as ScannerCapabilities;

      const settings = scanner.getRunningTrackSettings();

      const advanced: AdvancedCameraConstraint = {};

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        advanced.focusMode = "continuous";
      }

      if (capabilities.zoom) {
        const min = Number(capabilities.zoom.min ?? 1);
        const max = Number(capabilities.zoom.max ?? 1);
        const step = Number(capabilities.zoom.step ?? 0.25);

        setMinimumZoom(min);
        setMaximumZoom(max);
        setZoomStep(step > 0 ? step : 0.25);
        setZoomSupported(max > min);

        /*
         * Start with mild zoom only.
         * Too much digital zoom can enlarge blur.
         */
        const currentZoom = Number(
          (settings as MediaTrackSettings & {
            zoom?: number;
          }).zoom ?? min
        );

        const preferredZoom = Math.min(
          max,
          Math.max(min, currentZoom, 1.25)
        );

        advanced.zoom = preferredZoom;
        setZoom(preferredZoom);
      }

      if (capabilities.torch === true) {
        setTorchSupported(true);
      }

      if (Object.keys(advanced).length > 0) {
        await scanner.applyVideoConstraints({
          advanced: [advanced],
        } as MediaTrackConstraints);
      }
    } catch (error) {
      console.warn(
        "This browser does not expose autofocus/zoom controls:",
        error
      );
    }
  }

  async function verifyScannedValue(decodedText: string) {
    if (processingRef.current) return;

    processingRef.current = true;

    const ticketUuid = extractUuid(decodedText);

    await stopScanner();

    try {
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

      if (alreadyUsed) {
        setStatus("used");
        setMessage(responseMessage);
        playScannerSound("USED");
      } else {
        setStatus("error");
        setMessage(responseMessage);
        playScannerSound("REJECTED");
      }

      toast.error(responseMessage);
    } finally {
      processingRef.current = false;
    }
  }

 async function startScanner() {
  if (starting || scanning) return;

  try {
    await stopScanner();

    setStarting(true);
    setResult(null);
    setStatus("idle");
    setMessage("Requesting camera access...");

    const cameras = await Html5Qrcode.getCameras();

    if (!cameras || cameras.length === 0) {
      throw new Error("No camera was found on this device.");
    }

    console.log("Available cameras:", cameras);

    const rearCamera =
      cameras.find((camera) =>
        /back|rear|environment|world/i.test(camera.label)
      ) ??
      cameras[cameras.length - 1];

    const scanner = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });

    scannerRef.current = scanner;

    await scanner.start(
      rearCamera.id,
      {
        fps: 8,
        disableFlip: true,

        qrbox: (
          viewfinderWidth: number,
          viewfinderHeight: number
        ) => {
          const smallestSide = Math.min(
            viewfinderWidth,
            viewfinderHeight
          );

          const size = Math.floor(smallestSide * 0.85);

          return {
            width: size,
            height: size,
          };
        },
      },
      async (decodedText) => {
        await verifyScannedValue(decodedText);
      },
      () => {
        // Ignore normal decode failures while focusing.
      }
    );

    setScanning(true);
    setStarting(false);
    setMessage(
      "Hold the printed QR steady and slowly move the phone closer or farther."
    );

    window.setTimeout(() => {
      if (
        scannerRef.current === scanner &&
        scanner.isScanning
      ) {
        void applyCameraEnhancements(scanner);
      }
    }, 1200);
  } catch (error) {
    console.error("Scanner start failed:", error);

    scannerRef.current = null;
    setScanning(false);
    setStarting(false);
    setStatus("error");

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to start camera";

    setMessage(errorMessage);
    playScannerSound("REJECTED");
    toast.error(errorMessage);
  }
}

  async function changeZoom(nextZoom: number) {
    const scanner = scannerRef.current;

    if (!scanner || !scanner.isScanning) return;

    const safeZoom = Math.min(
      maximumZoom,
      Math.max(minimumZoom, nextZoom)
    );

    try {
      await scanner.applyVideoConstraints({
        advanced: [
          {
            zoom: safeZoom,
          } as AdvancedCameraConstraint,
        ],
      });

      setZoom(safeZoom);
    } catch (error) {
      console.warn("Zoom could not be applied:", error);
      toast.error("Zoom is not supported on this phone");
    }
  }

  async function toggleTorch() {
    const scanner = scannerRef.current;

    if (
      !scanner ||
      !scanner.isScanning ||
      !torchSupported
    ) {
      return;
    }

    const nextTorchState = !torchEnabled;

    try {
      await scanner.applyVideoConstraints({
        advanced: [
          {
            torch: nextTorchState,
          } as AdvancedCameraConstraint,
        ],
      });

      setTorchEnabled(nextTorchState);
    } catch (error) {
      console.warn("Torch could not be changed:", error);
      toast.error("Torch control is unavailable");
    }
  }

  async function refocusCamera() {
    const scanner = scannerRef.current;

    if (!scanner || !scanner.isScanning) return;

    try {
      const capabilities =
        scanner.getRunningTrackCapabilities() as ScannerCapabilities;

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("single-shot")
      ) {
        await scanner.applyVideoConstraints({
          advanced: [
            {
              focusMode: "single-shot",
            } as AdvancedCameraConstraint,
          ],
        });

        window.setTimeout(() => {
          if (
            scannerRef.current === scanner &&
            scanner.isScanning &&
            capabilities.focusMode?.includes("continuous")
          ) {
            void scanner.applyVideoConstraints({
              advanced: [
                {
                  focusMode: "continuous",
                } as AdvancedCameraConstraint,
              ],
            });
          }
        }, 700);

        toast.success("Camera refocused");
        return;
      }

      /*
       * On devices without exposed single-shot focus,
       * briefly changing zoom can sometimes trigger refocus.
       */
      if (zoomSupported) {
        const temporaryZoom = Math.min(
          maximumZoom,
          zoom + zoomStep
        );

        await changeZoom(temporaryZoom);

        window.setTimeout(() => {
          void changeZoom(zoom);
        }, 350);

        toast.success("Focus refreshed");
        return;
      }

      toast("Move the phone back slightly, then approach slowly");
    } catch (error) {
      console.warn("Refocus failed:", error);
      toast("Move the phone back slightly, then approach slowly");
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
        <div className="relative overflow-hidden rounded-3xl bg-black">
          <div
            id="qr-reader"
            className="min-h-[390px] w-full bg-black"
          />

          {!scanning && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center text-white">
              <div className="rounded-full bg-white/10 p-5">
                <Camera size={38} />
              </div>

              <p className="mt-5 text-lg font-black">
                Scanner is ready
              </p>

              <p className="mt-2 max-w-xs px-6 text-sm text-white/70">
                Start the rear camera, then place the full
                printed QR inside the frame.
              </p>
            </div>
          )}

          {scanning && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-0 top-0 h-14 w-14 border-l-4 border-t-4 border-white" />
                <span className="absolute right-0 top-0 h-14 w-14 border-r-4 border-t-4 border-white" />
                <span className="absolute bottom-0 left-0 h-14 w-14 border-b-4 border-l-4 border-white" />
                <span className="absolute bottom-0 right-0 h-14 w-14 border-b-4 border-r-4 border-white" />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-center text-xs font-bold text-white backdrop-blur">
                Keep the armband steady
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-medium text-gray-600">
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
              onClick={() => changeZoom(zoom - zoomStep)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut size={17} />
              Zoom out
            </button>

            <button
              type="button"
              disabled={!zoomSupported}
              onClick={() => changeZoom(zoom + zoomStep)}
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

        <div className="mt-5 flex gap-3">
          <Button
            onClick={startScanner}
            disabled={scanning || starting}
          >
            <span className="flex items-center justify-center gap-2">
              <ScanLine size={18} />
              {starting
                ? "Starting camera..."
                : scanning
                  ? "Scanner active"
                  : "Start Scanner"}
            </span>
          </Button>

          <button
            type="button"
            onClick={stopScanner}
            disabled={!scanning && !starting}
            className="flex min-w-28 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Square size={16} />
            Stop
          </button>
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
            <h2 className="text-3xl font-black text-gray-950">
              Ready to scan
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              For the printed armband, begin slightly farther
              away and slowly move closer until the QR becomes
              sharp.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-5 space-y-3">
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
              <p className="rounded-2xl bg-white/70 p-4 text-sm font-bold text-amber-900">
                Used at: {result.used_at}
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 space-y-3">
            <h2 className="text-4xl font-black text-red-700">
              Rejected
            </h2>

            <p className="text-sm leading-6 text-gray-700">
              {message ||
                "The ticket is invalid, revoked, or expired."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={startScanner}
          disabled={scanning || starting}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={17} />
          Scan Next Ticket
        </button>
      </Card>
    </div>
  );
}