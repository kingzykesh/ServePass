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

type CameraCapabilities = MediaTrackCapabilities & {
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
  focusMode?: string[];
  torch?: boolean;
};

type CameraSettings = MediaTrackSettings & {
  zoom?: number;
};

type CameraConstraint = MediaTrackConstraintSet & {
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
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    function playTone(
      frequency: number,
      duration: number,
      delay = 0,
      oscillatorType: OscillatorType = "square"
    ) {
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
    }

    void audioContext.resume();

    if (sound === "VALID") {
      playTone(1450, 0.16);
      playTone(1800, 0.18, 0.17);
    }

    if (sound === "USED") {
      playTone(850, 0.16);
      playTone(850, 0.16, 0.22);
      playTone(850, 0.16, 0.44);
    }

    if (sound === "REJECTED") {
      playTone(220, 0.65, 0, "sawtooth");
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1500);
  } catch (error) {
    console.warn("Unable to play scanner sound:", error);
  }
}

function getFriendlyCameraError(error: unknown): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : String(error || "");

  const message = rawMessage.toLowerCase();

  if (
    message.includes("permission") ||
    message.includes("notallowederror")
  ) {
    return "Camera permission was denied. Allow camera access in your browser settings and reload the page.";
  }

  if (
    message.includes("could not start video source") ||
    message.includes("notreadableerror") ||
    message.includes("track start")
  ) {
    return "The camera is currently unavailable. Close Camera, WhatsApp, Instagram or any app using the camera, then reload ServePass.";
  }

  if (
    message.includes("notfounderror") ||
    message.includes("requested device not found")
  ) {
    return "No usable camera was found on this device.";
  }

  if (
    message.includes("facingmode") ||
    message.includes("overconstrained")
  ) {
    return "The rear camera could not be selected. Reload the page and try again.";
  }

  return rawMessage || "Unable to start camera.";
}

export default function QRVerifier() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);

  const [status, setStatus] =
    useState<VerificationStatus>("idle");

  const [result, setResult] = useState<any>(null);

  const [message, setMessage] = useState(
    "Position the complete printed QR code inside the scanner frame."
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
        scanner.getRunningTrackCapabilities() as CameraCapabilities;

      const settings =
        scanner.getRunningTrackSettings() as CameraSettings;

      const advancedConstraint: CameraConstraint = {};

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        advancedConstraint.focusMode = "continuous";
      }

      if (capabilities.zoom) {
        const min = Number(capabilities.zoom.min ?? 1);
        const max = Number(capabilities.zoom.max ?? 1);
        const step = Number(
          capabilities.zoom.step ?? 0.25
        );

        setMinimumZoom(min);
        setMaximumZoom(max);
        setZoomStep(step > 0 ? step : 0.25);
        setZoomSupported(max > min);

        const currentZoom = Number(
          settings.zoom ?? min
        );

        const preferredZoom = Math.min(
          max,
          Math.max(min, currentZoom, 1.25)
        );

        advancedConstraint.zoom = preferredZoom;
        setZoom(preferredZoom);
      }

      if (capabilities.torch === true) {
        setTorchSupported(true);
      }

      if (
        Object.keys(advancedConstraint).length > 0
      ) {
        await scanner.applyVideoConstraints({
          advanced: [
            advancedConstraint as MediaTrackConstraintSet,
          ],
        });
      }
    } catch (error) {
      console.warn(
        "Camera enhancements are unavailable:",
        error
      );
    }
  }

  async function verifyScannedValue(
    decodedText: string
  ) {
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

    try {
      await stopScanner();

      setStarting(true);
      setResult(null);
      setStatus("idle");
      setMessage("Starting rear camera...");

      const scanner = new Html5Qrcode(
        "qr-reader",
        {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        }
      );

      scannerRef.current = scanner;

      /*
       * Your installed html5-qrcode version accepts
       * either a string or an object containing `exact`.
       */
      await scanner.start(
        {
          facingMode: {
            exact: "environment",
          },
        },
        {
          /*
           * Lower decoding FPS gives the phone camera
           * more time to focus on the small printed QR.
           */
          fps: 6,

          /*
           * A large scan region provides more QR pixels.
           */
          qrbox: (
            viewfinderWidth: number,
            viewfinderHeight: number
          ) => {
            const smallestSide = Math.min(
              viewfinderWidth,
              viewfinderHeight
            );

            const size = Math.floor(
              smallestSide * 0.86
            );

            return {
              width: size,
              height: size,
            };
          },

          disableFlip: true,
        },
        async (decodedText) => {
          await verifyScannedValue(decodedText);
        },
        () => {
          // Decode misses are normal while the camera focuses.
        }
      );

      setScanning(true);
      setStarting(false);

      setMessage(
        "Hold the armband steady. Begin slightly farther away and move closer slowly until the QR is sharp."
      );

      window.setTimeout(() => {
        if (
          scannerRef.current === scanner &&
          scanner.isScanning
        ) {
          void applyCameraEnhancements(scanner);
        }
      }, 1000);
    } catch (error) {
      console.error("Scanner start failed:", error);

      const friendlyMessage =
        getFriendlyCameraError(error);

      scannerRef.current = null;

      setScanning(false);
      setStarting(false);
      setStatus("error");
      setMessage(friendlyMessage);

      playScannerSound("REJECTED");
      toast.error(friendlyMessage);
    }
  }

  async function changeZoom(nextZoom: number) {
    const scanner = scannerRef.current;

    if (!scanner || !scanner.isScanning) {
      return;
    }

    const safeZoom = Math.min(
      maximumZoom,
      Math.max(minimumZoom, nextZoom)
    );

    try {
      await scanner.applyVideoConstraints({
        advanced: [
          {
            zoom: safeZoom,
          } as CameraConstraint,
        ],
      });

      setZoom(safeZoom);
    } catch (error) {
      console.warn("Zoom failed:", error);
      toast.error(
        "Zoom control is unavailable on this device"
      );
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
          } as CameraConstraint,
        ],
      });

      setTorchEnabled(nextTorchState);
    } catch (error) {
      console.warn("Torch failed:", error);
      toast.error(
        "Torch control is unavailable on this device"
      );
    }
  }

  async function refocusCamera() {
    const scanner = scannerRef.current;

    if (!scanner || !scanner.isScanning) {
      return;
    }

    try {
      const capabilities =
        scanner.getRunningTrackCapabilities() as CameraCapabilities;

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("single-shot")
      ) {
        await scanner.applyVideoConstraints({
          advanced: [
            {
              focusMode: "single-shot",
            } as CameraConstraint,
          ],
        });

        window.setTimeout(() => {
          if (
            scannerRef.current === scanner &&
            scanner.isScanning &&
            capabilities.focusMode?.includes(
              "continuous"
            )
          ) {
            void scanner.applyVideoConstraints({
              advanced: [
                {
                  focusMode: "continuous",
                } as CameraConstraint,
              ],
            });
          }
        }, 700);

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
        "Move the phone farther away, then approach the QR slowly"
      );
    } catch (error) {
      console.warn("Refocus failed:", error);

      toast(
        "Move the phone farther away, then approach the QR slowly"
      );
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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
              <div className="rounded-full bg-white/10 p-5">
                <Camera size={38} />
              </div>

              <p className="mt-5 text-lg font-black">
                Scanner is ready
              </p>

              <p className="mt-2 max-w-xs text-sm leading-6 text-white/70">
                Start the rear camera, then place the
                complete printed QR code inside the frame.
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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                Keep the full QR inside the frame
              </div>
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
              Begin approximately 20–30 cm away from
              the printed armband and approach it slowly.
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
          <RotateCcw size={17} />
          Scan Next Ticket
        </button>
      </Card>
    </div>
  );
}