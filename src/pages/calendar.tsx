import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import PermissionDenied from "./permission-denied";
import { getEvents, addEvent, deleteEvent, type CalendarEvent } from "@/lib/api/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, FileText, List, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export default function CalendarPage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, secretKey, permissions } = useSessionStore();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(true);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    desc: "",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (secretKey) {
      fetchEvents();
    }
  }, [isLoggedIn, secretKey, setLocation]);

  const fetchEvents = async () => {
    if (!secretKey) return;
    setIsLoading(true);
    try {
      const response = await getEvents(secretKey);
      if (response.status === 1 && response.data) {
        setEvents(response.data);
      } else if (response.status === 401) {
        toast({
          title: "Security Pin Required",
          description: "Please verify your security pin to access calendar",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch events",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(newEvent.start) >= new Date(newEvent.end)) {
      toast({
        title: "Error",
        description: "End date should be greater than start date",
        variant: "destructive",
      });
      return;
    }

    if (!secretKey) return;

    setIsLoading(true);
    try {
      const response = await addEvent(newEvent, secretKey);
      if (response.status === 1) {
        toast({
          title: "Success",
          description: response.msg || "Event added successfully",
        });
        setNewEvent({ title: "", start: "", end: "", desc: "" });
        setShowAddDialog(false);
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsLoading(true);
    try {
      const response = await deleteEvent(eventToDelete);
      if (response.status === 1) {
        toast({
          title: "Success",
          description: response.msg || "Event deleted successfully",
        });
        setShowDeleteDialog(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const eventDateStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      return selectedDateStart.getTime() === eventDateStart.getTime();
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.end) >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  const getAllEventsSorted = () => {
    return [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  if (!permissions.includes("calendar")) {
    return <PermissionDenied />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2 flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10" />
              Work Calendar
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">Manage your events and schedule</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Add Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-center w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    classNames={{
                      months: "flex flex-col space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      table: "w-full border-collapse",
                      cell: "h-9 w-9 text-center text-sm p-0 relative",
                      day: "h-9 w-9 p-0 font-normal relative",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {showAllEvents ? "All Events" : `Events on ${selectedDate ? moment(selectedDate).format("MMMM DD, YYYY") : "Selected Date"}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showAllEvents ? "outline" : "default"}
                      size="sm"
                      onClick={() => setShowAllEvents(true)}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      All Events
                    </Button>
                    <Button
                      variant={!showAllEvents ? "outline" : "default"}
                      size="sm"
                      onClick={() => setShowAllEvents(false)}
                      className="gap-2"
                      disabled={!selectedDate}
                    >
                      <CalendarDays className="h-4 w-4" />
                      By Date
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : showAllEvents ? (
                  getAllEventsSorted().length > 0 ? (
                    <div className="space-y-3">
                      {getAllEventsSorted().map((event) => (
                        <div
                          key={event._id}
                          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                            setSelectedDate(new Date(event.start));
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg break-words">{event.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {moment(event.start).format("MMM DD, YYYY")}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-words">
                                    {moment(event.start).format("LLL")} -{" "}
                                    {moment(event.end).format("LLL")}
                                  </span>
                                </div>
                                {event.desc && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="break-words">{event.desc}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventToDelete(event._id || null);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No events found
                    </div>
                  )
                ) : selectedDate ? (
                  getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-3">
                      {getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event._id}
                          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-2 break-words">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-words">
                                    {moment(event.start).format("LLL")} -{" "}
                                    {moment(event.end).format("LLL")}
                                  </span>
                                </div>
                                {event.desc && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="break-words">{event.desc}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventToDelete(event._id || null);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No events scheduled for this date
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Please select a date to view events
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : getUpcomingEvents().length > 0 ? (
                  <div className="space-y-3">
                    {getUpcomingEvents().map((event) => (
                      <div
                        key={event._id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                          setSelectedDate(new Date(event.start));
                        }}
                      >
                        <h4 className="font-semibold mb-1 break-words">{event.title}</h4>
                        <p className="text-sm text-muted-foreground break-words">
                          {moment(event.start).format("MMM DD, YYYY HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No upcoming events
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>Create a new calendar event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time *</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Time *</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={newEvent.desc}
                onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                placeholder="Optional event description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <p className="text-sm">{moment(selectedEvent.start).format("LLL")}</p>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <p className="text-sm">{moment(selectedEvent.end).format("LLL")}</p>
              </div>
              {selectedEvent.desc && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm">{selectedEvent.desc}</p>
                </div>
              )}
              {selectedEvent.createdAt && (
                <div className="space-y-2">
                  <Label>Created</Label>
                  <p className="text-sm">{moment(selectedEvent.createdAt).format("LLL")}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEventDialog(false);
                setEventToDelete(selectedEvent?._id || null);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

