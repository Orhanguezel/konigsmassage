// =============================================================
// FILE: src/components/admin/custompage/CustomPageRichContentField.tsx
// Zengin metin alanı
// =============================================================

import React from "react";
import { RichTextEditorBasic } from "@/components/ui/RichTextEditorBasic";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (html: string) => void;
};

export const CustomPageRichContentField: React.FC<Props> = ({
  value,
  disabled,
  onChange,
}) => {
  return (
    <div className="mb-0">
      <label className="form-label small mb-1">
        İçerik (zengin metin / HTML)
      </label>
      <RichTextEditorBasic
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="form-text small">
        Zengin metin editörü HTML içerik üretir. Backend bu alanı{" "}
        <code>packContent</code> ile{" "}
        <code>{'{"html":"..."}'}</code> formatına çevirerek kaydeder.
      </div>
    </div>
  );
};
