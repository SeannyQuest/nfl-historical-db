import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, validatePassword } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ResetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, newPassword } = validation.data;

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Find user by reset token with valid expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
