import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Folder } from "@/types/schema";

const folderFormSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Name is too long"),
});

type FolderFormValues = z.infer<typeof folderFormSchema>;

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: Folder | null;
  onSave: (data: FolderFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function FolderDialog({
  open,
  onOpenChange,
  folder,
  onSave,
  isLoading,
}: FolderDialogProps) {
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      name: folder?.name || "",
    },
  });

  const onSubmit = async (data: FolderFormValues) => {
    await onSave(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            {folder ? "Edit Folder" : "Create Folder"}
          </DialogTitle>
          <DialogDescription>
            {folder
              ? "Make changes to your folder below"
              : "Create a new folder to organize your tasks"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter folder name"
                      className="h-12"
                      data-testid="input-folder-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-folder"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-save-folder"
              >
                {isLoading ? "Saving..." : folder ? "Update Folder" : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
