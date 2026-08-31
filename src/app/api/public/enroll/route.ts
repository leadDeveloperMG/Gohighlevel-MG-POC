export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment } from "@/models/course";
import { createCheckoutSession } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const body = await req.json();
  await connectDB();
  const course = await Course.findById(body.courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (course.priceType !== "free") {
    const checkout = await createCheckoutSession({
      amount: course.price || 1000,
      successUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/c/${course.slug}?enrolled=1`,
      cancelUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/c/${course.slug}`,
      customerEmail: body.email,
      metadata: { courseId: String(course._id) },
    });
    if (checkout.url && !checkout.mocked) {
      return NextResponse.json({ url: checkout.url });
    }
  }

  await Enrollment.create({
    agencyId: course.agencyId,
    subAccountId: course.subAccountId,
    courseId: course._id,
    email: body.email,
    name: body.name,
    status: "active",
    progress: {},
  });
  return NextResponse.json({ ok: true });
}
