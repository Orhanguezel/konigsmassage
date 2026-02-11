// =============================================================
// FILE: src/components/common/AdminLocaleSelect.tsx
// konigsmassage – Admin Locale Select (Reusable)
// - Bootstrap input-group UI
// - Loading spinner + disabled logic
// =============================================================

import React from 'react';

export type AdminLocaleOption = {
  value: string; // "de"
  label: string; // "Türkçe (tr)"
};

export type AdminLocaleSelectProps = {
  value: string; // selected locale, can be "" (e.g., "all" or while loading)
  onChange: (locale: string) => void;

  options: AdminLocaleOption[];
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  id?: string;
};

export const AdminLocaleSelect: React.FC<AdminLocaleSelectProps> = ({
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  label = 'Dil',
  id,
}) => {
  const hasOptions = Array.isArray(options) && options.length > 0;

  return (
    <div className="flex items-center text-sm">
      <span className="bg-gray-100 text-gray-700 border border-r-0 border-gray-300 rounded-l px-3 py-2 flex items-center whitespace-nowrap">
        {label}
        {loading && <span className="ml-1 w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />}
      </span>

      <select
        id={id}
        className="form-select block w-full border border-gray-300 rounded-r px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || !hasOptions}
      >
        {options.map((opt) => (
          <option key={`${opt.value}:${opt.label}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
