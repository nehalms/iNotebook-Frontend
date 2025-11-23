import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, addTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/sessionStore";
import type { Task } from "@/types/schema";

export function useTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isPinSet, isPinVerified } = useSessionStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    retry: 1,
    // enabled: isPinSet && isPinVerified, 
    enabled: true,
  });

  const tasks: Task[] = data?.tasks || [];

  const createMutation = useMutation({
    mutationFn: addTask,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const message = data?.msg || data?.message || data?.error || "Task added successfully";
      const hasError = data?.error || (message && message.toLowerCase().includes('error'));
      toast({
        title: hasError ? "Warning" : "Success",
        description: message,
        variant: hasError ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTask(id, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const message = data?.msg || data?.message || data.error || "Task updated successfully";
      const hasError = data?.error || (message && message.toLowerCase().includes('error'));
      toast({
        title: hasError ? "Warning" : "Success",
        description: message,
        variant: hasError ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const message = data?.msg || data?.message || data?.error || "Task deleted successfully";
      const hasError = data?.error || (message && message.toLowerCase().includes('error'));
      toast({
        title: hasError ? "Warning" : "Success",
        description: message,
        variant: hasError ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

