import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateToken } from "@/lib/auth-utils";
import { sendPasswordResetEmail } from "@/lib/email-service";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success (don't leak whether email exists)
    if (user) {
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      await sendPasswordResetEmail(email, resetToken);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, you will receive password reset instructions",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
