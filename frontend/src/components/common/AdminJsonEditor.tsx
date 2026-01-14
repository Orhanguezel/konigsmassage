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
        <label className="form-label small d-flex align-items-center justify-content-between">
          <span>{label}</span>
          <span className="badge bg-light text-muted border small">JSON editor</span>
        </label>
      )}
      <textarea
        className={`form-control form-control-sm font-monospace ${error ? 'is-invalid' : ''}`}
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
      {helperText && !error && <div className="form-text small">{helperText}</div>}
      {error && <div className="invalid-feedback d-block small">JSON hatası: {error}</div>}
    </div>
  );
};
