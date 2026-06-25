import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
       className={`
w-full
rounded-2xl
border
border-gray-200
bg-white
px-4
py-3
text-gray-900
placeholder:text-gray-400
placeholder:font-medium
outline-none
transition
focus:border-green-600
focus:ring-4
focus:ring-green-100
${className}
`}
        {...props}
      />
    </label>
  );
}