"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = ["Password is required"];
    } else {
      const passwordErrors = [];
      if (formData.newPassword.length < 8) {
        passwordErrors.push("Password must be at least 8 characters");
      }
      if (!/[A-Z]/.test(formData.newPassword)) {
        passwordErrors.push("Must contain at least one uppercase letter");
      }
      if (!/[0-9]/.test(formData.newPassword)) {
        passwordErrors.push("Must contain at least one number");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword)) {
        passwordErrors.push("Must contain at least one special character");
      }
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = ["Please confirm your password"];
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = ["Passwords do not match"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError("");
    setSuccess(false);

    if (!token) {
      setGeneralError("Invalid reset link");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(
            data.details.reduce(
              (acc: Record<string, string[]>, err: { message: string }) => {
                acc.newPassword = [err.message];
                return acc;
              },
              {}
            )
          );
        } else {
          setGeneralError(data.error || "Password reset failed");
        }
      } else {
        setSuccess(true);
        setFormData({ newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a]">
        <div className="w-full max-w-sm rounded-xl border border-[#1e2a45] bg-[#141b2d] p-10 text-center">
          <h1 className="text-2xl font-bold text-white">GridIron Intel</h1>
          <p className="mt-4 text-sm text-red-400">Invalid reset link</p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block font-semibold text-[#d4af37] hover:underline"
          >
            Request another reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-sm rounded-xl border border-[#1e2a45] bg-[#141b2d] p-10 text-center">
        <h1 className="text-2xl font-bold text-white">GridIron Intel</h1>
        <p className="mt-1 text-sm text-[#8899aa]">Create New Password</p>
        <div className="mx-auto mt-4 h-[3px] w-16 rounded bg-[#d4af37]" />

        {generalError && (
          <p className="mt-4 text-sm text-red-400">{generalError}</p>
        )}

        {success && (
          <p className="mt-4 text-sm text-green-400">
            Password reset successfully! Redirecting to login...
          </p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 text-left">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs uppercase tracking-wide text-[#8899aa]"
              >
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                autoFocus
                className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <div className="mt-1 text-xs text-red-400">
                  {errors.newPassword.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label
                htmlFor="confirmPassword"
                className="block text-xs uppercase tracking-wide text-[#8899aa]"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <div className="mt-1 text-xs text-red-400">
                  {errors.confirmPassword.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-4 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-[#8899aa]">
          <Link href="/login" className="font-semibold text-[#d4af37] hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
