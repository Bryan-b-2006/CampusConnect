import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Users, MapPin, Clock, Heart, MessageCircle, Share2, Ticket } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  organizerId: number;
  audience: string;
  capacity?: number;
  registrationDeadline?: string;
}

interface EventRsvp {
  id: number;
  eventId: number;
  userId: number;
  status: string;
  rsvpNumber: string;
  registeredAt: string;
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRsvpDialogOpen, setIsRsvpDialogOpen] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events?status=published", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ["/api/my-rsvps"],
    queryFn: async () => {
      const response = await fetch("/api/my-rsvps", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch RSVPs");
      return response.json();
    },
    enabled: !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, attendeeData }: { 
      eventId: number; 
      attendeeData: { name: string; email: string; phone?: string } 
    }) => {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(attendeeData),
      });
      if (!response.ok) throw new Error("Failed to RSVP");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-rsvps"] });
      setIsRsvpDialogOpen(false);
      setAttendeeName("");
      setAttendeeEmail("");
      setAttendeePhone("");
      toast({
        title: "RSVP Successful!",
        description: `Your RSVP number is: ${data.rsvpNumber}. Save this for event entry.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (event: Event) => {
    setSelectedEvent(event);
    setAttendeeName(user?.username || "");
    setAttendeeEmail(user?.email || "");
    setIsRsvpDialogOpen(true);
  };

  const handleSubmitRsvp = () => {
    if (!selectedEvent || !attendeeName.trim() || !attendeeEmail.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    rsvpMutation.mutate({
      eventId: selectedEvent.id,
      attendeeData: {
        name: attendeeName,
        email: attendeeEmail,
        phone: attendeePhone,
      },
    });
  };

  const isEventRsvped = (eventId: number) => {
    return myRsvps.some((rsvp: EventRsvp) => rsvp.eventId === eventId && rsvp.status === 'confirmed');
  };

  const getEventRsvp = (eventId: number) => {
    return myRsvps.find((rsvp: EventRsvp) => rsvp.eventId === eventId && rsvp.status === 'confirmed');
  };

  const isRegistrationOpen = (event: Event) => {
    if (!event.registrationDeadline) return true;
    return new Date() < new Date(event.registrationDeadline);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  // Filter events based on user role - students only see audience events
  const visibleEvents = user?.role === 'student' ? 
    events.filter((event: Event) => event.audience === 'public' || event.audience === 'students') :
    events;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campus Events</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Discover and register for upcoming events on campus
          </p>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg">No events available at the moment</p>
              <p className="text-sm">Check back later for upcoming events</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event: Event) => {
              const isRsvped = isEventRsvped(event.id);
              const rsvp = getEventRsvp(event.id);
              const canRegister = isRegistrationOpen(event);

              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.status === 'published' ? "default" : "secondary"}>
                            {event.status}
                          </Badge>
                          {event.audience && (
                            <Badge variant="outline">
                              {event.audience}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {event.description}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString()} at{" "}
                          {new Date(event.startDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      {event.endDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Until {new Date(event.endDate).toLocaleDateString()} at{" "}
                            {new Date(event.endDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>

                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}

                      {event.registrationDeadline && (
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4" />
                          <span>
                            Registration until: {new Date(event.registrationDeadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span>Like</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          <span>Comment</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {isRsvped ? (
                          <div className="text-center">
                            <Badge variant="default" className="bg-green-600">
                              RSVP'd
                            </Badge>
                            {rsvp && (
                              <p className="text-xs text-gray-500 mt-1">
                                #{rsvp.rsvpNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRsvp(event)}
                            disabled={!canRegister || rsvpMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {!canRegister ? "Registration Closed" : "RSVP"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isRsvpDialogOpen} onOpenChange={setIsRsvpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>RSVP for {selectedEvent?.title}</DialogTitle>
              <DialogDescription>
                Please provide your details to register for this event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRsvpDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRsvp}
                disabled={rsvpMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {rsvpMutation.isPending ? "Registering..." : "Confirm RSVP"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}