import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, Trash2, CheckCircle2, Circle } from "lucide-react";
import type { Task } from "@/types/schema";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  isDeleting,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((st) => st.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-chart-4 text-chart-4-foreground";
      case "low":
        return "bg-chart-2 text-chart-2-foreground";
      default:
        return "bg-muted";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 25) return "bg-destructive";
    if (progress <= 50) return "bg-chart-4";
    if (progress <= 75) return "bg-chart-3";
    return "bg-chart-2";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] rounded-2xl flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-serif">{task.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {task.createdAt && format(new Date(task.createdAt), "MMM d, yyyy 'at' hh:mm a")}
              </DialogDescription>
            </div>
            <Badge className={`${getPriorityBadgeColor(task.priority)} text-sm`}>
              {task.priority}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-6">
          {subtasks.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Subtasks</span>
                  <span className="text-muted-foreground">
                    {completedCount} of {totalCount} completed ({progress}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      subtask.completed
                        ? "bg-muted border-muted-foreground/20"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {subtask.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium ${
                            subtask.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {subtask.name}
                        </div>
                        {subtask.description && (
                          <div
                            className={`text-sm mt-1 ${
                              subtask.completed ? "text-muted-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {subtask.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subtasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No subtasks added yet.</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onEdit}
            className="gap-2"
            data-testid="button-edit-task-detail"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

