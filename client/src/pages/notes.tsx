import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Note } from "@shared/schema";

interface NotesPageProps {
  notes?: Note[];
  isLoading?: boolean;
  onCreateNote?: () => void;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
}

export default function NotesPage({
  notes = [],
  isLoading,
  onCreateNote,
  onEditNote,
  onDeleteNote,
}: NotesPageProps) {
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
          onClick={onCreateNote}
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
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="rounded-xl hover-elevate cursor-pointer group"
              data-testid={`card-note-${note.id}`}
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-xl font-semibold line-clamp-1 flex-1"
                    onClick={() => onEditNote?.(note)}
                  >
                    {note.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-note-menu-${note.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEditNote?.(note)}
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteNote?.(note.id)}
                        className="text-destructive"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0" onClick={() => onEditNote?.(note)}>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {note.isEncrypted ? (
                    <Badge
                      variant="secondary"
                      className="gap-1"
                      data-testid={`badge-encrypted-${note.id}`}
                    >
                      <Lock className="h-3 w-3" />
                      Encrypted
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1"
                      data-testid={`badge-unencrypted-${note.id}`}
                    >
                      <Unlock className="h-3 w-3" />
                      Unencrypted
                    </Badge>
                  )}
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
                  {format(new Date(note.updatedAt), "MMM d, yyyy")}
                </span>
              </CardFooter>
            </Card>
          ))}
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
            <Button onClick={onCreateNote} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
