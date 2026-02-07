export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify-email?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[EMAIL] Verification email to ${email}`);
    console.log(`[EMAIL] Link: ${verificationUrl}`);
    return;
  }

  // In production, integrate with SendGrid, Resend, or similar
  console.log(`[TODO] Send verification email to ${email}`);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[EMAIL] Password reset email to ${email}`);
    console.log(`[EMAIL] Link: ${resetUrl}`);
    return;
  }

  // In production, integrate with SendGrid, Resend, or similar
  console.log(`[TODO] Send password reset email to ${email}`);
}
