import { connectDB } from "@/lib/db";
import { getActiveLocation } from "@/lib/current-location";
import { Task } from "@/models/crm";
import { addTaskAction, toggleTaskAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default async function TasksPage() {
  const { subAccountId } = await getActiveLocation();
  await connectDB();
  const tasks = await Task.find({ subAccountId }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <PageHeader title="Tasks" description="Assignable follow-ups for this location." />
      <form action={addTaskAction} className="mb-6 flex gap-2">
        <Input name="title" placeholder="Task title" required />
        <Input name="dueDate" type="date" className="w-44" />
        <Button type="submit">Add</Button>
      </form>
      <div className="space-y-2">
        {tasks.map((task) => (
          <form
            key={String(task._id)}
            action={toggleTaskAction}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
          >
            <input type="hidden" name="taskId" value={String(task._id)} />
            <div>
              <div className={task.status === "done" ? "line-through text-muted-foreground" : "font-medium"}>
                {task.title}
              </div>
              <div className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</div>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              {task.status === "done" ? "Reopen" : "Complete"}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
