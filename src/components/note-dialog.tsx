import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Note } from "@/types/schema";

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  tag: z.string().max(50, "Tag is too long").optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
  onSave: (data: NoteFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSave,
  isLoading,
}: NoteDialogProps) {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
      tag: note?.tag || "",
    },
  });

  // Reset form when note changes
  React.useEffect(() => {
    if (note) {
      form.reset({
        title: note.title || "",
        content: note.content || "",
        tag: note.tag || "",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        tag: "",
      });
    }
  }, [note, form]);

  const onSubmit = async (data: NoteFormValues) => {
    await onSave(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-serif">
            {note ? "Edit Note" : "Create Note"}
          </DialogTitle>
          <DialogDescription>
            {note
              ? "Make changes to your note below"
              : "Create a new note to capture your ideas"}
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
                      placeholder="Enter note title"
                      className="h-12"
                      data-testid="input-note-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write your note content here..."
                      className="min-h-48 max-h-96 resize-y"
                      data-testid="input-note-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., work, personal, ideas"
                      className="h-12"
                      data-testid="input-note-tag"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  data-testid="button-cancel-note"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-save-note"
                >
                  {isLoading ? "Saving..." : note ? "Update Note" : "Create Note"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
