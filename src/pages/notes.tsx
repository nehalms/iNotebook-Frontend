import { useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import PermissionDenied from "./permission-denied";
import { Plus, Search, Filter, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { NoteDialog } from "@/components/note-dialog";
import { NoteDetailDialog } from "@/components/note-detail-dialog";
import { useNotes } from "@/hooks/use-notes";
import type { Note } from "@/types/schema";

export default function NotesPage() {
  const { permissions } = useSessionStore();
  
  if (!permissions.includes("notes")) {
    return <PermissionDenied />;
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
  const { notes, isLoading, createNote, updateNote, deleteNote, isCreating, isUpdating, isDeleting } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === "all" || note.tag === filterTag;
    return matchesSearch && matchesTag;
  });

  const uniqueTags = Array.from(new Set(notes.map((n) => n.tag).filter(Boolean)));

  const handleCreateNote = () => {
    setSelectedNote(null);
    setDialogOpen(true);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setDetailDialogOpen(false);
    setDialogOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteConfirmNoteId(noteId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmNoteId) {
      deleteNote(deleteConfirmNoteId);
      setDeleteConfirmNoteId(null);
      setDetailDialogOpen(false);
      setSelectedNote(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmNoteId(null);
  };

  const handleSaveNote = async (data: { title: string; content: string; tag?: string; isEncrypted?: boolean }) => {
    if (selectedNote) {
      await updateNote({
        id: selectedNote.id,
        data: {
          title: data.title,
          description: data.content,
          tag: data.tag || "",
        },
      });
    } else {
      await createNote({
        title: data.title,
        description: data.content,
        tag: data.tag || "",
      });
    }
    setDialogOpen(false);
    setSelectedNote(null);
  };

  const handleEditFromDetail = () => {
    if (selectedNote) {
      handleEditNote(selectedNote);
    }
  };

  const handleDeleteFromDetail = () => {
    if (selectedNote) {
      handleDeleteNote(selectedNote.id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Notes</h1>
          <p className="text-muted-foreground text-lg">
            Manage your secure notes and ideas
          </p>
        </div>
        <Button
          onClick={handleCreateNote}
          className="h-12 gap-2"
          data-testid="button-create-note"
        >
          <Plus className="h-5 w-5" />
          New Note
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10"
            data-testid="input-search-notes"
          />
        </div>
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-full sm:w-48 h-12" data-testid="select-filter-tag">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {uniqueTags.map((tag) => (
              <SelectItem key={tag} value={tag!}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isConfirmingDelete = deleteConfirmNoteId === note.id;
            
            return (
              <Card
                key={note.id}
                className="rounded-xl hover-elevate cursor-pointer group relative"
                data-testid={`card-note-${note.id}`}
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="text-xl font-semibold line-clamp-1 flex-1 cursor-pointer"
                      onClick={() => handleViewNote(note)}
                    >
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 cursor-pointer" onClick={() => handleViewNote(note)}>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content}
                  </p>
                </CardContent>
                <CardFooter className="p-6 pt-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {note.tag && (
                      <Badge variant="outline" data-testid={`badge-tag-${note.id}`}>
                        {note.tag}
                      </Badge>
                    )}
                  </div>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid={`text-date-${note.id}`}
                  >
                    {format(new Date(note.date), "MMM d, yyyy hh:mm a")}
                  </span>
                </CardFooter>
                
                {isConfirmingDelete && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4 bg-card/95 backdrop-blur-sm rounded-lg p-6 shadow-lg border">
                      <p className="text-sm font-medium">Are you sure?</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            confirmDelete();
                          }}
                          className="p-2 hover:bg-green-50 rounded-full transition-colors bg-green-100"
                          data-testid={`button-confirm-delete-${note.id}`}
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
                          className="p-2 hover:bg-red-50 rounded-full transition-colors bg-red-100"
                          data-testid={`button-cancel-delete-${note.id}`}
                          type="button"
                        >
                          <X className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || filterTag !== "all"
              ? "No notes found"
              : "No notes yet"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {searchQuery || filterTag !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first note to get started"}
          </p>
          {!(searchQuery || filterTag !== "all") && (
            <Button onClick={handleCreateNote} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          )}
        </div>
      )}

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={selectedNote}
        onSave={handleSaveNote}
        isLoading={isCreating || isUpdating}
      />

      <NoteDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        note={selectedNote}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        isDeleting={isDeleting}
      />
    </div>
  );
}
