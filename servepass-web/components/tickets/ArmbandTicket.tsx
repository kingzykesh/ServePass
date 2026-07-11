"use client";

import { QRCodeCanvas } from "qrcode.react";

export type ArmbandTicketData = {
  id: number | string;
  holder_name: string;
  matric_number?: string | null;
  ticket_code: string;
  ticket_uuid: string;
  event_title?: string;
  meal_session_title?: string;
  status?: string;
};

type ArmbandTicketProps = {
  ticket: ArmbandTicketData;
};

export default function ArmbandTicket({
  ticket,
}: ArmbandTicketProps) {
  const publicTicketUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ticket/${ticket.ticket_uuid}`
      : "";

  return (
    <article
      className="armband-print-item relative overflow-hidden bg-white"
      style={{
        width: "10in",
        height: "1in",
      }}
    >
      <img
        src="/templates/tech-fusion-armband.png"
        alt="Tech Fusion armband template"
        className="absolute inset-0 h-full w-full object-fill"
      />

      {/* QR code white area */}
      <div
        className="absolute flex items-center justify-center bg-white"
        style={{
          left: "0.17in",
          top: "0.05in",
          width: "0.9in",
          height: "0.9in",
        }}
      >
        <QRCodeCanvas
          value={publicTicketUrl}
          size={120}
          level="H"
          includeMargin={false}
          style={{
            width: "0.82in",
            height: "0.82in",
          }}
        />
      </div>

      {/* Vertical ticket holder name */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          left: "0.02in",
          top: "0.05in",
          width: "0.18in",
          height: "0.9in",
        }}
      >
        <p
          className="whitespace-nowrap font-black uppercase text-black"
          style={{
            transform: "rotate(-90deg)",
            fontSize: "9px",
            lineHeight: 1,
            maxWidth: "0.82in",
          }}
        >
          {ticket.holder_name}
        </p>
      </div>

      {/* Vertical ticket code */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          left: "1.08in",
          top: "0.05in",
          width: "0.16in",
          height: "0.9in",
        }}
      >
        <p
          className="whitespace-nowrap text-black"
          style={{
            transform: "rotate(90deg)",
            fontSize: "6px",
            lineHeight: 1,
          }}
        >
          {ticket.ticket_code}
        </p>
      </div>
    </article>
  );
}