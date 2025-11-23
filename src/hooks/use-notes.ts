import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllNotes, addNote, updateNote, deleteNote } from "@/lib/api/notes";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/sessionStore";
import type { Note } from "@/types/schema";

export function useNotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isPinSet, isPinVerified } = useSessionStore();

  const { data: notes = [], isLoading, error } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: fetchAllNotes,
    retry: 1,
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: addNote,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      const message = data?.msg || data?.message || data?.Success || data?.error || "Note added successfully";
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
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; tag?: string } }) =>
      updateNote(id, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      const message = data?.msg || data?.message || data?.Success || data?.error || "Note updated successfully";
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
    mutationFn: deleteNote,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      const message = data?.Success || data?.msg || data?.message || data?.error || "Note deleted successfully";
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
    notes,
    isLoading,
    error,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

