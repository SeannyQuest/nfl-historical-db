import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    const portalUrl = await createPortalSession(user.stripeCustomerId);

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Could not create portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
