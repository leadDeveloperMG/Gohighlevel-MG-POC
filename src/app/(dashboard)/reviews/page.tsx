import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Review } from "@/models/workflow";
import { saveReviewLinksAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function ReviewsPage() {
  const { subAccountId, sub } = await getActiveLocation();
  await connectDB();
  const reviews = await Review.find({ subAccountId }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <PageHeader title="Reputation" description="Review request tracking. Completed/Won deals trigger the review workflow." />
      <form action={saveReviewLinksAction} className="mb-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-2">
        <Input
          name="googleReviewUrl"
          placeholder="Google review URL"
          defaultValue={sub.googleReviewUrl || ""}
        />
        <Input
          name="facebookReviewUrl"
          placeholder="Facebook review URL"
          defaultValue={sub.facebookReviewUrl || ""}
        />
        <Button type="submit">Save links</Button>
      </form>
      <div className="space-y-2">
        {reviews.map((r) => (
          <div key={String(r._id)} className="flex justify-between rounded-lg border bg-white px-4 py-3 text-sm">
            <div>
              <div className="font-medium capitalize">{r.platform}</div>
              <div className="text-muted-foreground">{r.link}</div>
            </div>
            <div className="text-right">
              <Badge tone={r.clickedAt ? "success" : "muted"}>{r.clickedAt ? "clicked" : "sent"}</Badge>
              <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.requestSentAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
