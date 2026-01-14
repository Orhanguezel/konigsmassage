// =============================================================
// FILE: src/components/admin/slider/SliderFormJsonSection.tsx
// Slider – JSON editor (AdminJsonEditor wrapper)
// =============================================================

"use client";

import React from "react";
import { AdminJsonEditor } from "@/components/common/AdminJsonEditor";

export type SliderFormJsonSectionProps = {
  jsonModel: any;
  disabled: boolean;
  onChangeJson: (json: any) => void;
  onErrorChange: (err: string | null) => void;
};

export const SliderFormJsonSection: React.FC<SliderFormJsonSectionProps> = ({
  jsonModel,
  disabled,
  onChangeJson,
  onErrorChange,
}) => {
  return (
    <AdminJsonEditor
      label="Slider JSON (create/update payload)"
      value={jsonModel}
      disabled={disabled}
      onChange={onChangeJson}
      onErrorChange={onErrorChange}
      height={340}
      helperText={
        <>
          Bu JSON, slider create / update payload&apos;ı ile uyumludur.{" "}
          <code>locale</code>, <code>name</code>, <code>slug</code>,{" "}
          <code>description</code>, <code>image_url</code>, <code>alt</code>,{" "}
          <code>buttonText</code>, <code>buttonLink</code>,{" "}
          <code>featured</code>, <code>is_active</code>,{" "}
          <code>display_order</code> alanlarını buradan düzenleyebilirsin. Geçerli
          JSON&apos;da yaptığın değişiklikler forma yansır.
        </>
      }
    />
  );
};
