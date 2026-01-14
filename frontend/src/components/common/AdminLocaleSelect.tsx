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
    <div className="input-group input-group-sm">
      <span className="input-group-text">
        {label}
        {loading && <span className="ms-1 spinner-border spinner-border-sm" />}
      </span>

      <select
        id={id}
        className="form-select"
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
