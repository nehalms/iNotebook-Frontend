import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, Folder } from "@/types/schema";
import { format } from "date-fns";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type Subtask = {
  name: string;
  description: string;
  completed: boolean;
};

type TaskFormValues = z.infer<typeof taskFormSchema> & {
  subtasks?: Subtask[];
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  folders?: Folder[];
  onSave: (data: TaskFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  folders = [],
  onSave,
  isLoading,
}: TaskDialogProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [error, setError] = useState<string>("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      status: (task?.status === "pending" || task?.status === "in_progress" || task?.status === "completed") 
        ? task.status 
        : "pending",
      priority: (task?.priority === "low" || task?.priority === "medium" || task?.priority === "high")
        ? task.priority
        : "medium",
    },
  });

  // Reset form and subtasks when task changes
  React.useEffect(() => {
    if (task) {
      const status = (task.status === "pending" || task.status === "in_progress" || task.status === "completed") 
        ? task.status 
        : "pending";
      const priority = (task.priority === "low" || task.priority === "medium" || task.priority === "high")
        ? task.priority
        : "medium";
      
      form.reset({
        title: task.title || "",
        status: status,
        priority: priority,
      });

      // Load subtasks from task - need to get from API response
      // For now, if task has subtasks property, use it, otherwise create from description
      if ((task as any).subtasks && Array.isArray((task as any).subtasks)) {
        setSubtasks((task as any).subtasks);
      } else {
        // If no subtasks, create one from description or empty
        setSubtasks(task.description 
          ? [{ name: task.title, description: task.description, completed: task.status === "completed" }]
          : [{ name: "", description: "", completed: false }]
        );
      }
    } else {
      form.reset({
        title: "",
        status: "pending",
        priority: "medium",
      });
      setSubtasks([{ name: "", description: "", completed: false }]);
    }
    setError("");
  }, [task, form]);

  const handleSubtaskChange = (index: number, field: keyof Subtask, value: string | boolean) => {
    setError("");
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
    setSubtasks(updatedSubtasks);
  };

  const handleAddSubtask = () => {
    setError("");
    setSubtasks([...subtasks, { name: "", description: "", completed: false }]);
  };

  const handleDeleteSubtask = (index: number) => {
    if (subtasks.length > 1) {
      const updatedSubtasks = subtasks.filter((_, i) => i !== index);
      setSubtasks(updatedSubtasks);
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    setError("");
    
    // Validate subtasks
    if (subtasks.length === 0) {
      setError("Add at least one subtask");
      return;
    }
    
    if (subtasks.some(st => !st.name || !st.description)) {
      setError("Please fill all subtask fields");
      return;
    }

    await onSave({ ...data, subtasks });
    form.reset();
    setSubtasks([{ name: "", description: "", completed: false }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-serif">
            {task ? "Edit Task" : "Create Task"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Make changes to your task below"
              : "Create a new task to track your work"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter task title"
                      className="h-12"
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Sub Tasks</FormLabel>
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Name"
                      value={subtask.name}
                      onChange={(e) => handleSubtaskChange(index, "name", e.target.value)}
                      disabled={task ? (subtask.completed || false) : false}
                      className="h-10"
                      data-testid={`input-subtask-name-${index}`}
                    />
                    <Input
                      placeholder="Description"
                      value={subtask.description}
                      onChange={(e) => handleSubtaskChange(index, "description", e.target.value)}
                      disabled={task ? (subtask.completed || false) : false}
                      className="h-10"
                      data-testid={`input-subtask-description-${index}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {task && (
                    <input
                      type="checkbox"
                      checked={subtask.completed || false}
                      onChange={(e) => handleSubtaskChange(index, "completed", e.target.checked)}
                      className="h-5 w-5 cursor-pointer"
                      data-testid={`checkbox-subtask-${index}`}
                    />
                    )}
                    {(index > 0 || task) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubtask(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        data-testid={`button-delete-subtask-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSubtask}
                className="w-full gap-2"
                data-testid="button-add-subtask"
              >
                <Plus className="h-4 w-4" />
                Add Subtask
              </Button>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="h-12"
                          data-testid="select-task-status"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="h-12"
                          data-testid="select-task-priority"
                        >
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  data-testid="button-cancel-task"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-save-task"
                >
                  {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
