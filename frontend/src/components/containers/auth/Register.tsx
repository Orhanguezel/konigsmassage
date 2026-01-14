// =============================================================
// FILE: src/components/containers/auth/Register.tsx
// =============================================================
"use client";

import React, { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  useSignupMutation,
  useOauthStartMutation,
} from "@/integrations/rtk/hooks";
import { tokenStore } from "@/integrations/core/token";
import { normalizeError } from "@/integrations/core/errors";

// Yeni i18n helper'lar
import { useResolvedLocale } from "@/i18n/locale";
import { useUiSection } from "@/i18n/uiDb";


const Register: React.FC = () => {
  const router = useRouter();
  const locale = useResolvedLocale();
  const { ui } = useUiSection("ui_auth", locale);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [signup, signupState] = useSignupMutation();
  const [googleStart, googleState] = useOauthStartMutation();

  const isLoading = signupState.isLoading || googleState.isLoading;

  const apiErrorMessage = useMemo(() => {
    if (!signupState.error) return null;
    return normalizeError(signupState.error).message;
  }, [signupState.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError(
        ui(
          "register_error_required",
          "Email and password are required.",
        ),
      );
      return;
    }
    if (password.length < 6) {
      setFormError(
        ui(
          "register_error_password_length",
          "Password must be at least 6 characters.",
        ),
      );
      return;
    }
    if (password !== passwordAgain) {
      setFormError(
        ui(
          "register_error_password_mismatch",
          "Passwords do not match.",
        ),
      );
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        },
      } as const;

      const resp = await signup(payload).unwrap();
      if (resp.access_token) tokenStore.set(resp.access_token);
      router.push("/");
    } catch {
      // Hata signupState.error'dan okunuyor
    }
  };

  const handleGoogleRegister = async () => {
    if (typeof window === "undefined") return;
    setFormError(null);
    try {
      const currentUrl = window.location.origin || "";
      const resp = await googleStart({ redirectTo: currentUrl }).unwrap();
      if (resp.url) {
        window.location.href = resp.url;
      }
    } catch (err) {
      const n = normalizeError(err as any);
      setFormError(
        n.message ||
        ui(
          "register_error_google_generic",
          "An error occurred while starting Google signup.",
        ),
      );
    }
  };

  const errorToShow = formError || apiErrorMessage;

  return (
    <section className="tp-register-area pt-120 pb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="tp-register-wrapper p-4 p-md-5 shadow-sm bg-white rounded">
              <h3 className="mb-3 text-center">
                {ui("register_title", "Sign Up")}
              </h3>
              <p className="text-center mb-4">
                {ui(
                  "register_lead_has_account",
                  "Already have an account?",
                )}{" "}
                <Link href="/login" className="text-primary">
                  {ui("register_login_link", "Sign in")}
                </Link>
                .
              </p>

              {errorToShow ? (
                <div className="alert alert-danger py-2 small mb-3">
                  {errorToShow}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="tp-register-form">
                <div className="mb-3">
                  <label htmlFor="reg-fullname" className="form-label">
                    {ui("register_fullname_label", "Full Name")}
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    className="form-control"
                    placeholder={ui(
                      "register_fullname_placeholder",
                      "Your full name",
                    )}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="reg-phone" className="form-label">
                    {ui("register_phone_label", "Phone")}
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-control"
                    placeholder={ui(
                      "register_phone_placeholder",
                      "+90 5xx xxx xx xx",
                    )}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="reg-email" className="form-label">
                    {ui("register_email_label", "Email")}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-control"
                    placeholder={ui(
                      "register_email_placeholder",
                      "example@konigsmassage.com",
                    )}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="reg-password" className="form-label">
                    {ui("register_password_label", "Password")}
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className="form-control"
                    placeholder={ui(
                      "register_password_placeholder",
                      "Your password",
                    )}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="reg-password-again"
                    className="form-label"
                  >
                    {ui(
                      "register_password_again_label",
                      "Password (again)",
                    )}
                  </label>
                  <input
                    id="reg-password-again"
                    type="password"
                    className="form-control"
                    placeholder={ui(
                      "register_password_again_placeholder",
                      "Re-enter your password",
                    )}
                    autoComplete="new-password"
                    value={passwordAgain}
                    onChange={(e) => setPasswordAgain(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-100 mb-3 solid__btn d-inline-flex justify-content-center align-items-center gap-2"
                  disabled={isLoading}
                >
                  {signupState.isLoading
                    ? ui("register_loading", "Creating account...")
                    : ui("register_submit", "Sign Up")}
                </button>
              </form>

              <div className="text-center mb-3">
                <span className="d-inline-block position-relative">
                  <span className="px-2 bg-white position-relative z-1">
                    {ui("register_or", "or")}
                  </span>
                  <span className="register-divider" />
                </span>
              </div>

              <button
                type="button"
                className="w-100 border__btn d-inline-flex justify-content-center align-items-center gap-2"
                onClick={handleGoogleRegister}
                disabled={isLoading}
              >
                {googleState.isLoading ? (
                  <>{ui("register_google_loading", "Redirecting to Google...")}</>
                ) : (
                  <>
                    <span className="register-google-icon">G</span>
                    <span>
                      {ui(
                        "register_google_button",
                        "Continue with Google",
                      )}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-divider {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          border-bottom: 1px solid #e5e5e5;
          transform: translateY(-50%);
          z-index: 0;
        }
        .register-google-icon {
          display: inline-flex;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          background: #fff;
        }
      `}</style>
    </section>
  );
};

export default Register;
