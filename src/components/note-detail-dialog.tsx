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
import { Edit, Trash2 } from "lucide-react";
import type { Note } from "@/types/schema";

interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function NoteDetailDialog({
  open,
  onOpenChange,
  note,
  onEdit,
  onDelete,
  isDeleting,
}: NoteDetailDialogProps) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] rounded-2xl flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-serif">{note.title}</DialogTitle>
          <DialogDescription>
            {note.date && format(new Date(note.date), "MMM d, yyyy 'at' hh:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4">
          <div className="space-y-2">
            {note.tag && (
              <Badge variant="outline" className="text-sm">
                {note.tag}
              </Badge>
            )}
          </div>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {note.content}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onEdit}
            className="gap-2"
            data-testid="button-edit-note-detail"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

