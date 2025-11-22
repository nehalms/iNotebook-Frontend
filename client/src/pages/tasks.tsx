import { useState } from "react";
import {
  Plus,
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import type { Task, Folder as FolderType } from "@shared/schema";

interface TasksPageProps {
  tasks?: Task[];
  folders?: FolderType[];
  isLoading?: boolean;
  onCreateTask?: () => void;
  onCreateFolder?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskStatus?: (taskId: string, status: string) => void;
  onEditFolder?: (folder: FolderType) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export default function TasksPage({
  tasks = [],
  folders = [],
  isLoading,
  onCreateTask,
  onCreateFolder,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onEditFolder,
  onDeleteFolder,
}: TasksPageProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredTasks = tasks.filter(
    (task) => !selectedFolderId || task.folderId === selectedFolderId
  );

  const tasksByStatus = {
    pending: filteredTasks.filter((t) => t.status === "pending"),
    inProgress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className={`rounded-lg border-l-4 ${getPriorityColor(task.priority)} hover-elevate cursor-pointer`}
      data-testid={`card-task-${task.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() =>
              onToggleTaskStatus?.(
                task.id,
                task.status === "completed" ? "pending" : "completed"
              )
            }
            className="mt-1"
            data-testid={`checkbox-task-${task.id}`}
          />
          <div className="flex-1 min-w-0" onClick={() => onEditTask?.(task)}>
            <h4
              className={`font-medium mb-1 ${
                task.status === "completed"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
              {task.dueDate && (
                <span className="text-xs text-muted-foreground">
                  Due {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-task-menu-${task.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditTask?.(task)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteTask?.(task.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const FolderItem = ({ folder }: { folder: FolderType }) => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderTasks = tasks.filter((t) => t.folderId === folder.id);

    return (
      <div>
        <div
          className={`flex items-center gap-2 p-3 rounded-lg hover-elevate cursor-pointer ${
            selectedFolderId === folder.id ? "bg-sidebar-accent" : ""
          }`}
          onClick={() => setSelectedFolderId(folder.id)}
          data-testid={`folder-${folder.id}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <Folder className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">{folder.name}</span>
          <Badge variant="secondary" className="text-xs">
            {folderTasks.length}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditFolder?.(folder)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteFolder?.(folder.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCreateFolder}
            className="h-12 gap-2"
            data-testid="button-create-folder"
          >
            <FolderPlus className="h-5 w-5" />
            New Folder
          </Button>
          <Button
            onClick={onCreateTask}
            className="h-12 gap-2"
            data-testid="button-create-task"
          >
            <Plus className="h-5 w-5" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 rounded-xl h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Folders</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCreateFolder}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg hover-elevate cursor-pointer ${
                !selectedFolderId ? "bg-sidebar-accent" : ""
              }`}
              onClick={() => setSelectedFolderId(null)}
              data-testid="folder-all-tasks"
            >
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="flex-1 font-medium">All Tasks</span>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              folders.map((folder) => (
                <FolderItem key={folder.id} folder={folder} />
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Circle className="h-5 w-5" />
                  <h3 className="font-semibold">To Do</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {tasksByStatus.pending.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : tasksByStatus.pending.length > 0 ? (
                  tasksByStatus.pending.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No pending tasks
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-chart-4">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">In Progress</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {tasksByStatus.inProgress.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : tasksByStatus.inProgress.length > 0 ? (
                  tasksByStatus.inProgress.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No tasks in progress
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-chart-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="font-semibold">Completed</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {tasksByStatus.completed.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : tasksByStatus.completed.length > 0 ? (
                  tasksByStatus.completed.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No completed tasks
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
