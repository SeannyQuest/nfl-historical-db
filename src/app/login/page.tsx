"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect credentials. Try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-sm rounded-xl border border-[#1e2a45] bg-[#141b2d] p-10 text-center">
        <h1 className="text-2xl font-bold text-white">GridIron Intel</h1>
        <p className="mt-1 text-sm text-[#8899aa]">
          NFL Historical Database
        </p>
        <div className="mx-auto mt-4 h-[3px] w-16 rounded bg-[#d4af37]" />

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 text-left">
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
            required
            autoFocus
            className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
            placeholder="Enter username"
          />

          <label
            htmlFor="password"
            className="mt-4 block text-xs uppercase tracking-wide text-[#8899aa]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37]"
            placeholder="Enter password"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-4 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Access Database"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
