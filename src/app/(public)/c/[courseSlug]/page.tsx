export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/course";
import { EnrollButton } from "@/components/public/enroll-button";

export default async function CoursePage({ params }: { params: { courseSlug: string } }) {
  await connectDB();
  const course = await Course.findOne({ slug: params.courseSlug }).lean();
  if (!course) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-4xl font-semibold">{course.title}</h1>
      <p className="mt-3 text-muted-foreground">{course.description}</p>
      <p className="mt-2 text-sm capitalize">
        {course.priceType}
        {course.price ? ` · $${(course.price / 100).toFixed(0)}` : ""}
      </p>
      <EnrollButton courseId={String(course._id)} priceType={course.priceType} />
      <ol className="mt-8 space-y-4">
        {course.modules.map((mod: { title?: string; lessons: { title?: string; type?: string }[] }, i: number) => (
          <li key={i} className="rounded-xl border bg-white p-4">
            <h2 className="font-medium">{mod.title}</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {mod.lessons.map((lesson: { title?: string; type?: string }, j: number) => (
                <li key={j}>
                  {lesson.title} · {lesson.type}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </main>
  );
}
