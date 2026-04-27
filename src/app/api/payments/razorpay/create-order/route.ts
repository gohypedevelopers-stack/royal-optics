export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const session = await requireUserSession();
    const body = await request.json();
    const orderId = String(body.orderId || "");

    if (!orderId) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.userId,
      },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod !== "RAZORPAY") {
      return NextResponse.json({ error: "Order is not configured for Razorpay" }, { status: 400 });
    }

    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.grandTotal) * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        internalOrderId: order.id,
      },
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        providerOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder,
      internalOrderId: order.id,
      amount: order.grandTotal,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: error.message || "Unable to create payment order" }, { status: 400 });
  }
}

