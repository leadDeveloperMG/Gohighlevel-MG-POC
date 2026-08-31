import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { CommunityPost, Course, Enrollment } from "@/models/course";
import { addCommunityPostAction, saveCourseAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoursesPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const [courses, enrollments, posts] = await Promise.all([
    Course.find({ subAccountId }).lean(),
    Enrollment.find({ subAccountId }).lean(),
    CommunityPost.find({ subAccountId }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  return (
    <div>
      <PageHeader title="Courses & community" description="Modules, lessons, enrollment, and threaded posts." />
      <form action={saveCourseAction} className="mb-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-2">
        <Input name="title" placeholder="Course title" required />
        <select name="priceType" className="h-9 rounded-md border px-3 text-sm">
          <option value="free">free</option>
          <option value="one_time">one_time</option>
          <option value="subscription">subscription</option>
        </select>
        <Input name="price" type="number" placeholder="Price cents" />
        <Textarea name="description" className="md:col-span-2" placeholder="Description" />
        <Button type="submit">Create course</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={String(course._id)}>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{course.modules?.length || 0} modules</p>
              <p>{enrollments.filter((e) => String(e.courseId) === String(course._id)).length} enrolled</p>
              <Link className="text-primary underline" href={`/c/${course.slug}`}>
                Open public course
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Community</h2>
      <form action={addCommunityPostAction} className="mb-4 grid gap-2">
        <Input name="title" placeholder="Thread title" required />
        <Textarea name="body" placeholder="Post body" required />
        <Button type="submit" variant="secondary">
          Post
        </Button>
      </form>
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={String(p._id)} className="rounded-lg border bg-white p-4">
            <div className="font-medium">{p.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            <p className="mt-2 text-xs">{p.comments?.length || 0} comments</p>
          </div>
        ))}
      </div>
    </div>
  );
}
