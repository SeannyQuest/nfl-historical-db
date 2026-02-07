"use client";

import { useState, Suspense } from "react";
import Link from "next/link";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred");
      } else {
        setSuccess(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-sm rounded-xl border border-[#1e2a45] bg-[#141b2d] p-10 text-center">
        <h1 className="text-2xl font-bold text-white">GridIron Intel</h1>
        <p className="mt-1 text-sm text-[#8899aa]">Reset Your Password</p>
        <div className="mx-auto mt-4 h-[3px] w-16 rounded bg-[#d4af37]" />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {success && (
          <p className="mt-4 text-sm text-green-400">
            Check your email for password reset instructions
          </p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 text-left">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wide text-[#8899aa]"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
              placeholder="Enter your email"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-4 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
