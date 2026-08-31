export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/workflow";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  await connectDB();
  const review = await Review.findOne({ token: params.token });
  if (!review) return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  review.clickedAt = new Date();
  await review.save();
  return NextResponse.redirect(review.link || "/");
}
