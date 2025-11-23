import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { TaskDialog } from "@/components/task-dialog";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/types/schema";

export default function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);
  const { tasks, isLoading, createTask, updateTask, deleteTask, isCreating, isUpdating, isDeleting } = useTasks();

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(false);
    setDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteConfirmTaskId(taskId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmTaskId) {
      deleteTask(deleteConfirmTaskId);
      setDeleteConfirmTaskId(null);
      setDetailDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmTaskId(null);
  };

  const handleSaveTask = async (data: {
    title: string;
    status: string;
    priority: string;
    subtasks?: Array<{ name: string; description: string; completed: boolean }>;
  }) => {
    if (selectedTask) {
      await updateTask({
        id: selectedTask.id,
        data: {
          title: data.title,
          priority: data.priority,
          subtasks: data.subtasks || [],
        },
      });
    } else {
      await createTask({
        title: data.title,
        priority: data.priority,
        subtasks: data.subtasks || [],
      });
    }
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleEditFromDetail = () => {
    if (selectedTask) {
      handleEditTask(selectedTask);
    }
  };

  const handleDeleteFromDetail = () => {
    if (selectedTask) {
      handleDeleteTask(selectedTask.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "border-l-destructive bg-destructive/5";
      case "medium":
        return "border-l-chart-4 bg-chart-4/5";
      case "low":
        return "border-l-chart-2 bg-chart-2/5";
      default:
        return "border-l-muted";
    }
  };

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

  const TaskCard = ({ task }: { task: Task }) => {
    const isConfirmingDelete = deleteConfirmTaskId === task.id;
    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter((st) => st.completed).length;
    const totalCount = subtasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return (
      <Card
        className={`rounded-xl border-l-4 ${getPriorityColor(task.priority)} hover-elevate cursor-pointer group`}
        data-testid={`card-task-${task.id}`}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-2">
            {isConfirmingDelete ? (
              <div className="flex items-center justify-center gap-3 w-full">
                <p className="text-sm font-medium">Are you sure?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      confirmDelete();
                    }}
                    className="p-1 hover:bg-green-50 rounded transition-colors"
                    data-testid={`button-confirm-delete-${task.id}`}
                    type="button"
                  >
                    <Check className="h-5 w-5 text-green-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cancelDelete();
                    }}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    data-testid={`button-cancel-delete-${task.id}`}
                    type="button"
                  >
                    <X className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleViewTask(task)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-lg leading-tight">
                      {task.title}
                    </h4>
                    <Badge className={`${getPriorityBadgeColor(task.priority)} text-xs`}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.createdAt), "MMM d, yyyy 'at' hh:mm a")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTask(task);
                    }}
                    data-testid={`button-edit-task-${task.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardHeader>
        {!isConfirmingDelete && (
          <CardContent className="px-6 pb-6 pt-0 cursor-pointer" onClick={() => handleViewTask(task)}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completedCount} of {totalCount} subtasks completed
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Tasks</h1>
          <p className="text-muted-foreground text-lg">
            Organize and track your tasks
          </p>
        </div>
        <Button
          onClick={handleCreateTask}
          className="h-12 gap-2"
          data-testid="button-create-task"
        >
          <Plus className="h-5 w-5" />
          New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
          </CardContent>
        </Card>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        folders={[]}
        onSave={handleSaveTask}
        isLoading={isCreating || isUpdating}
      />

      <TaskDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        task={selectedTask}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        isDeleting={isDeleting}
      />
    </div>
  );
}
