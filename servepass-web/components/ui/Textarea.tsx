import React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export default function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        className={`
min-h-32
w-full
resize-none
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