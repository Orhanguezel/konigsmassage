// ===================================================================
// FILE: src/components/admin/email-templates/EmailTemplateFormJsonSection.tsx
// Email Templates – JSON Section (variables JSON + detected vars)
// ===================================================================

"use client";

import React from "react";
import type { EmailTemplateFormValues } from "./EmailTemplateFormPage";
import { AdminJsonEditor } from "@/components/common/AdminJsonEditor";

interface EmailTemplateFormJsonSectionProps {
  values: EmailTemplateFormValues;
  onVariablesChange: (next: unknown) => void;
}

export const EmailTemplateFormJsonSection: React.FC<
  EmailTemplateFormJsonSectionProps
> = ({ values, onVariablesChange }) => {
  const detected = values.detectedVariables ?? [];

  return (
    <div className="card">
      <div className="card-body p-3">
        <AdminJsonEditor
          label={
            <span>
              Variables JSON{" "}
              <span className="text-muted">
                (template key için ortak değişken listesi)
              </span>
            </span>
          }
          value={values.variablesValue ?? []}
          onChange={onVariablesChange}
          helperText={
            <>
              <div>
                Bu alan <code>email_templates.variables</code> kolonuna
                yazılacak JSON&apos;u temsil eder. Backend tarafında{" "}
                <code>string[]</code> veya JSON string olarak kabul edilir.
              </div>
              <div>
                Önerilen format:{" "}
                <code>[´user_name´,´reset_link´,´site_name´]</code>
              </div>
            </>
          }
          height={220}
        />

        <hr className="my-3" />

        <div className="small">
          <div className="fw-semibold mb-1">
            İçerikten Tespit Edilen Placeholder&apos;lar
            {values.locale && (
              <span className="text-muted ms-1">
                (locale: <code>{values.locale}</code>)
              </span>
            )}
          </div>
          {detected.length > 0 ? (
            <ul className="mb-0 ps-3">
              {detected.map((v) => (
                <li key={v}>
                  <code>{v}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">
              Bu locale için henüz tespit edilmiş placeholder yok veya
              backend henüz bu kaydı analiz etmedi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
