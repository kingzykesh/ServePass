"use client";

import { X } from "lucide-react";

export default function Drawer({
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
    <div className="fixed inset-0 z-[100]">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <section className="absolute bottom-0 right-0 h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:top-0 sm:h-full sm:max-w-xl sm:rounded-none sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-950">{title}</h2>

          <button onClick={onClose} className="rounded-full bg-gray-100 p-2">
            <X size={20} />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}