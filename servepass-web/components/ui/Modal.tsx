"use client";

import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-950">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2">
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}