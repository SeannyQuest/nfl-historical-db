"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    if (!formData.username) {
      newErrors.username = ["Username is required"];
    } else if (formData.username.length < 3) {
      newErrors.username = ["Username must be at least 3 characters"];
    } else if (formData.username.length > 20) {
      newErrors.username = ["Username must be at most 20 characters"];
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = ["Username can only contain letters, numbers, underscores, and hyphens"];
    }

    if (!formData.email) {
      newErrors.email = ["Email is required"];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ["Invalid email address"];
    }

    if (!formData.password) {
      newErrors.password = ["Password is required"];
    } else {
      const passwordErrors = [];
      if (formData.password.length < 8) {
        passwordErrors.push("Password must be at least 8 characters");
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push("Must contain at least one uppercase letter");
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push("Must contain at least one number");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        passwordErrors.push("Must contain at least one special character");
      }
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = ["Please confirm your password"];
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = ["Passwords do not match"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          if (data.error.includes("Email")) {
            setErrors({ email: [data.error] });
          } else if (data.error.includes("Username")) {
            setErrors({ username: [data.error] });
          }
        } else if (response.status === 400) {
          if (data.details) {
            setErrors(
              data.details.reduce(
                (acc: Record<string, string[]>, err: { path: string[]; message: string }) => {
                  const path = err.path[0] as string;
                  acc[path] = [err.message];
                  return acc;
                },
                {}
              )
            );
          } else {
            setGeneralError(data.error || "Signup failed");
          }
        } else {
          setGeneralError(data.error || "An error occurred");
        }
      } else {
        const callbackUrl = searchParams.get("callbackUrl");
        router.push(`/login?success=true&callbackUrl=${encodeURIComponent(callbackUrl || "/")}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-sm rounded-xl border border-[#1e2a45] bg-[#141b2d] p-10 text-center">
        <h1 className="text-2xl font-bold text-white">GridIron Intel</h1>
        <p className="mt-1 text-sm text-[#8899aa]">Create an Account</p>
        <div className="mx-auto mt-4 h-[3px] w-16 rounded bg-[#d4af37]" />

        {generalError && (
          <p className="mt-4 text-sm text-red-400">{generalError}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 text-left">
          <div>
            <label
              htmlFor="username"
              className="block text-xs uppercase tracking-wide text-[#8899aa]"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
              placeholder="Choose a username"
            />
            {errors.username && (
              <div className="mt-1 text-xs text-red-400">
                {errors.username.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wide text-[#8899aa]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className="mt-1 text-xs text-red-400">
                {errors.email.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wide text-[#8899aa]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
              placeholder="Enter password"
            />
            {errors.password && (
              <div className="mt-1 text-xs text-red-400">
                {errors.password.map((err, idx) => (
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8899aa]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#d4af37] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
