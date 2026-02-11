// =============================================================
// FILE: src/components/common/AdminJsonEditor.tsx
// konigsmassage – Ortak JSON Editör Bileşeni
// - Monospace textarea
// - JSON.stringify ile pretty-print
// - Blur'da parse edip onChange ile geri gönderir
// - Hata durumunda invalid state + mesaj
// =============================================================

'use client';

import React, { useEffect, useState } from 'react';

type AdminJsonEditorProps = {
  label?: React.ReactNode;
  value: unknown;
  onChange: (next: any) => void; // yalnızca geçerli JSON olduğunda çağrılır
  onErrorChange?: (err: string | null) => void;
  disabled?: boolean;
  helperText?: React.ReactNode;
  height?: number;
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '';
  }
};

export const AdminJsonEditor: React.FC<AdminJsonEditorProps> = ({
  label,
  value,
  onChange,
  onErrorChange,
  disabled,
  helperText,
  height = 260,
}) => {
  const [text, setText] = useState<string>(() => safeStringify(value));
  const [internalError, setInternalError] = useState<string | null>(null);

  // Dışarıdan value değişirse textarea'yı senkronize et
  useEffect(() => {
    setText(safeStringify(value));
  }, [value]);

  const handleBlur = () => {
    const trimmed = text.trim();

    // Boş bırakılırsa {} kabul et
    if (!trimmed) {
      const parsed: any = {};
      onChange(parsed);
      setInternalError(null);
      onErrorChange?.(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setInternalError(null);
      onErrorChange?.(null);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'Geçersiz JSON';
      setInternalError(msg);
      onErrorChange?.(msg);
    }
  };

  const error = internalError;

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="bg-gray-100 text-gray-500 border text-xs px-2 py-0.5 rounded">JSON editor</span>
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
        style={{
          minHeight: height,
          whiteSpace: 'pre',
          fontFamily:
            "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {helperText && !error && <div className="mt-1 text-xs text-gray-500">{helperText}</div>}
      {error && <div className="mt-1 text-xs text-red-600">JSON hatası: {error}</div>}
    </div>
  );
};
