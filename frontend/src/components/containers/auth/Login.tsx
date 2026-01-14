// =============================================================
// FILE: src/components/containers/auth/Login.tsx
// =============================================================
"use client";

import React, { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  useLoginMutation,
  useOauthStartMutation,
} from "@/integrations/rtk/hooks";
import { tokenStore } from "@/integrations/core/token";
import { normalizeError } from "@/integrations/core/errors";

// Yeni i18n helper'lar
import { useResolvedLocale } from "@/i18n/locale";
import { useUiSection } from "@/i18n/uiDb";


const Login: React.FC = () => {
  const router = useRouter();
  const locale = useResolvedLocale();
  const { ui } = useUiSection("ui_auth", locale);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [login, loginState] = useLoginMutation();
  const [googleStart, googleState] = useOauthStartMutation();

  const isLoading = loginState.isLoading || googleState.isLoading;

  const apiErrorMessage = useMemo(() => {
    if (!loginState.error) return null;
    return normalizeError(loginState.error).message;
  }, [loginState.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError(
        ui(
          "login_error_required",
          "Email and password are required.",
        ),
      );
      return;
    }

    try {
      const resp = await login({
        email: email.trim(),
        password,
      }).unwrap();

      // access_token'ı RTK baseQuery için sakla
      if (resp.access_token) tokenStore.set(resp.access_token);

      // User bilgisini de saklayalım (admin’de gösterebiliriz)
      if (typeof window !== "undefined" && resp.user) {
        window.localStorage.setItem("user", JSON.stringify(resp.user));
      }

      // Login başarılı → admin ana sayfasına
      router.push("/admin");
    } catch {
      // Hata loginState.error üzerinden gösteriliyor
    }
  };

  const handleGoogleLogin = async () => {
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
          "login_error_google_generic",
          "An error occurred while starting Google login.",
        ),
      );
    }
  };

  const errorToShow = formError || apiErrorMessage;

  return (
    <section className="tp-login-area pt-120 pb-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="tp-login-wrapper p-4 p-md-5 shadow-sm bg-white rounded">
              <h3 className="mb-3 text-center">
                {ui("login_title", "Sign In")}
              </h3>
              <p className="text-center mb-4">
                {ui(
                  "login_lead",
                  "Sign in to your account or create a new one.",
                )}{" "}
                <Link href="/register" className="text-primary">
                  {ui("login_register_link", "Create an account")}
                </Link>
                .
              </p>

              {errorToShow ? (
                <div className="alert alert-danger py-2 small mb-3">
                  {errorToShow}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="tp-login-form">
                <div className="mb-3">
                  <label htmlFor="login-email" className="form-label">
                    {ui("login_email_label", "Email")}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    placeholder={ui(
                      "login_email_placeholder",
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
                  <label htmlFor="login-password" className="form-label">
                    {ui("login_password_label", "Password")}
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    className="form-control"
                    placeholder={ui(
                      "login_password_placeholder",
                      "Your password",
                    )}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      id="remember-me"
                      className="form-check-input"
                      type="checkbox"
                      disabled={isLoading}
                    />
                    <label
                      className="form-check-label small"
                      htmlFor="remember-me"
                    >
                      {ui("login_remember_me", "Remember me")}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-100 mb-3 solid__btn d-inline-flex justify-content-center align-items-center gap-2"
                  disabled={isLoading}
                >
                  {loginState.isLoading
                    ? ui("login_loading", "Signing in...")
                    : ui("login_submit", "Sign In")}
                </button>
              </form>

              <div className="text-center mb-3">
                <span className="d-inline-block position-relative">
                  <span className="px-2 bg-white position-relative z-1">
                    {ui("login_or", "or")}
                  </span>
                  <span className="login-divider" />
                </span>
              </div>

              <button
                type="button"
                className="w-100 border__btn d-inline-flex justify-content-center align-items-center gap-2"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {googleState.isLoading ? (
                  <>{ui("login_google_loading", "Redirecting to Google...")}</>
                ) : (
                  <>
                    <span className="login-google-icon">G</span>
                    <span>
                      {ui(
                        "login_google_button",
                        "Continue with Google",
                      )}
                    </span>
                  </>
                )}
              </button>

              <p className="mt-4 text-center small text-muted">
                {ui("login_no_account", "Don't have an account?")}{" "}
                <Link href="/register" className="text-primary">
                  {ui("login_register_cta", "Sign up")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-divider {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          border-bottom: 1px solid #e5e5e5;
          transform: translateY(-50%);
          z-index: 0;
        }
        .login-google-icon {
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

export default Login;
