// =============================================================
// FILE: src/components/containers/auth/Logout.tsx
// =============================================================
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useLogoutMutation } from "@/integrations/rtk/hooks";
import { tokenStore } from "@/integrations/core/token";
import { normalizeError } from "@/integrations/core/errors";

// i18n helper'lar
import { useResolvedLocale } from "@/i18n/locale";
import { useUiSection } from "@/i18n/uiDb";


const Logout: React.FC = () => {
  const router = useRouter();
  const [logout, logoutState] = useLogoutMutation();

  const locale = useResolvedLocale();
  const { ui } = useUiSection("ui_auth", locale);

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      try {
        await logout().unwrap();
      } catch (err) {
        if (!canceled) {
          const n = normalizeError(err as any);
          console.warn("logout error:", n.message);
        }
      } finally {
        tokenStore.set(null);
        if (!canceled) {
          router.push("/login");
        }
      }
    };

    run();

    return () => {
      canceled = true;
    };
  }, [logout, router]);

  return (
    <section className="tp-logout-area pt-120 pb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 text-center">
            <div className="p-4 p-md-5 shadow-sm bg-white rounded">
              <h3 className="mb-3">
                {ui("logout_title", "Signing out...")}
              </h3>
              <p className="text-muted small">
                {ui(
                  "logout_lead",
                  "Please wait, you will be redirected to the login page in a few seconds.",
                )}
              </p>
              {logoutState.isError ? (
                <p className="text-danger small mt-2">
                  {ui(
                    "logout_error",
                    "There was a problem signing out from the server, but your local session has been cleared.",
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Logout;
