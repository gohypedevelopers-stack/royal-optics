export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();

  const razorpayOrderId = String(body.razorpay_order_id || "");
  const razorpayPaymentId = String(body.razorpay_payment_id || "");
  const razorpaySignature = String(body.razorpay_signature || "");

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment verification payload" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where: { providerOrderId: razorpayOrderId } });
  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerPaymentId: razorpayPaymentId,
        providerSignature: razorpaySignature,
        paidAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
      },
    }),
  ]);

  return NextResponse.json({ success: true, orderId: payment.orderId });
}

