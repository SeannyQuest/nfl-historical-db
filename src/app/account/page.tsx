"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <p className="text-[#8899aa]">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <Link href="/login" className="text-[#d4af37] hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const userTier = (session.user as { subscriptionTier?: string }).subscriptionTier || "FREE";

  async function handleUpgrade(tier: string) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManageBilling() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-[#d4af37]">Account Settings</h1>

        <div className="mt-8 rounded-xl border border-[#1e2a45] bg-[#141b2d] p-6">
          <h2 className="text-xl font-bold text-white">Profile Information</h2>
          <div className="mt-4 space-y-2">
            <p>
              <span className="text-[#8899aa]">Name:</span> {session.user.name || "Not set"}
            </p>
            <p>
              <span className="text-[#8899aa]">Email:</span> {session.user.email}
            </p>
            <p>
              <span className="text-[#8899aa]">Email Verified:</span>{" "}
              <span className={userTier === "FREE" ? "text-yellow-400" : "text-green-400"}>
                {userTier === "FREE" ? "Pending" : "Verified"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-[#1e2a45] bg-[#141b2d] p-6">
          <h2 className="text-xl font-bold text-white">Subscription Tier</h2>
          <div className="mt-4">
            <div className="rounded-lg border border-[#2a3a55] bg-[#0d1321] p-4">
              <p className="text-lg font-bold text-[#d4af37]">Current Plan: {userTier}</p>
              <p className="mt-2 text-sm text-[#8899aa]">
                {userTier === "FREE"
                  ? "You are on the free plan. Upgrade to unlock premium features."
                  : userTier === "PRO"
                    ? "You have access to all PRO features."
                    : "You have access to all features including admin tools."}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`rounded-lg border p-4 ${userTier === "FREE" ? "border-[#d4af37] bg-[#1a2332]" : "border-[#2a3a55] bg-[#0d1321]"}`}>
                <h3 className="font-bold text-white">Free Plan</h3>
                <ul className="mt-2 space-y-1 text-sm text-[#8899aa]">
                  <li>Basic analytics</li>
                  <li>Limited data access</li>
                </ul>
                {userTier === "FREE" && (
                  <p className="mt-4 text-sm text-[#d4af37]">Current Plan</p>
                )}
              </div>

              <div className={`rounded-lg border p-4 ${userTier === "PRO" ? "border-[#d4af37] bg-[#1a2332]" : "border-[#2a3a55] bg-[#0d1321]"}`}>
                <h3 className="font-bold text-white">Pro Plan</h3>
                <ul className="mt-2 space-y-1 text-sm text-[#8899aa]">
                  <li>Advanced analytics</li>
                  <li>Full historical data</li>
                </ul>
                {userTier !== "PRO" && (
                  <button
                    onClick={() => handleUpgrade("PRO")}
                    disabled={isLoading}
                    className="mt-4 w-full rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-4 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Upgrade to Pro"}
                  </button>
                )}
                {userTier === "PRO" && (
                  <p className="mt-4 text-sm text-[#d4af37]">Current Plan</p>
                )}
              </div>

              <div className={`rounded-lg border p-4 ${userTier === "ADMIN" ? "border-[#d4af37] bg-[#1a2332]" : "border-[#2a3a55] bg-[#0d1321]"}`}>
                <h3 className="font-bold text-white">Admin Plan</h3>
                <ul className="mt-2 space-y-1 text-sm text-[#8899aa]">
                  <li>All Pro features</li>
                  <li>Admin tools</li>
                </ul>
                {userTier !== "ADMIN" && (
                  <button
                    onClick={() => handleUpgrade("ADMIN")}
                    disabled={isLoading}
                    className="mt-4 w-full rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-4 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Upgrade to Admin"}
                  </button>
                )}
                {userTier === "ADMIN" && (
                  <p className="mt-4 text-sm text-[#d4af37]">Current Plan</p>
                )}
              </div>
            </div>
          </div>

          {userTier !== "FREE" && (
            <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="mt-6 rounded-md bg-[#2a3a55] px-4 py-2 text-sm font-bold text-[#d4af37] transition-colors hover:bg-[#3a4a65] disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Manage Billing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
