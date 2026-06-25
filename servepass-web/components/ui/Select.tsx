import React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
};

export default function Select({ label, children, className = "", ...props }: SelectProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        className={`w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}