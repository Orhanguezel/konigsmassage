// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/_components/CustomPageRichContentField.tsx
// FINAL — Rich content wrapper (optional)
// =============================================================

'use client';

import React from 'react';
import RichContentEditor from '@/app/(main)/admin/_components/common/RichContentEditor';

type Props = {
  value: string;
  disabled: boolean;
  onChange: (html: string) => void;
};

export const CustomPageRichContentField: React.FC<Props> = ({ value, disabled, onChange }) => {
  return (
    <div className="space-y-1">
      <label className="block text-xs text-muted-foreground">İçerik (zengin metin / HTML)</label>
      <RichContentEditor value={value} onChange={onChange} disabled={disabled} />
      <div className="text-xs text-muted-foreground">
        Editör HTML üretir. Backend, bu alanı <code>packContent</code> ile{' '}
        <code>{'{"html":"..."}'}</code> formatına çevirebilir.
      </div>
    </div>
  );
};
