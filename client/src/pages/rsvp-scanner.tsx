import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  QrCode, CheckCircle, XCircle, Scan, User, Calendar, 
  MapPin, Clock, AlertTriangle, Users, Search, Download
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

const rsvpScanSchema = z.object({
  rsvpNumber: z.string().min(6, "RSVP number must be at least 6 characters"),
  eventId: z.number().min(1, "Please select an event"),
});

const manualCheckInSchema = z.object({
  email: z.string().email("Invalid email address"),
  eventId: z.number().min(1, "Please select an event"),
});

interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  status: string;
}

interface RsvpRecord {
  id: number;
  eventId: number;
  userId: number;
  rsvpNumber: string;
  status: string;
  checkedIn: boolean;
  checkedInAt?: string;
  user: {
    username: string;
    email: string;
    fullName: string;
  };
  event: {
    title: string;
  };
}

function RsvpScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<RsvpRecord | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Queries
  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: eventRsvps = [] } = useQuery({
    queryKey: ["/api/events", selectedEvent, "rsvps"],
    enabled: !!selectedEvent,
  });

  const { data: checkedInCount = 0 } = useQuery({
    queryKey: ["/api/events", selectedEvent, "checkins"],
    enabled: !!selectedEvent,
  });

  // Forms
  const scanForm = useForm<z.infer<typeof rsvpScanSchema>>({
    resolver: zodResolver(rsvpScanSchema),
    defaultValues: {
      eventId: selectedEvent || 0,
    },
  });

  const manualForm = useForm<z.infer<typeof manualCheckInSchema>>({
    resolver: zodResolver(manualCheckInSchema),
    defaultValues: {
      eventId: selectedEvent || 0,
    },
  });

  // Mutations
  const scanRsvpMutation = useMutation({
    mutationFn: (data: z.infer<typeof rsvpScanSchema>) =>
      apiRequest("POST", "/api/rsvp/scan", data),
    onSuccess: (response) => {
      response.json().then((result) => {
        setScanResult(result.rsvp);
        setScanError(null);
        queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent, "rsvps"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent, "checkins"] });
        toast({ 
          description: result.checkedIn ? "Successfully checked in!" : "RSVP verified but already checked in"
        });
      });
    },
    onError: (error: any) => {
      setScanError(error.message || "Failed to scan RSVP");
      setScanResult(null);
      toast({ 
        variant: "destructive",
        description: error.message || "Invalid RSVP number" 
      });
    },
  });

  const manualCheckInMutation = useMutation({
    mutationFn: (data: z.infer<typeof manualCheckInSchema>) =>
      apiRequest("POST", "/api/rsvp/manual-checkin", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent, "rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent, "checkins"] });
      toast({ description: "Manual check-in successful!" });
      manualForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Manual check-in failed" 
      });
    },
  });

  const onScanSubmit = (values: z.infer<typeof rsvpScanSchema>) => {
    scanRsvpMutation.mutate({
      ...values,
      eventId: selectedEvent || values.eventId,
    });
  };

  const onManualSubmit = (values: z.infer<typeof manualCheckInSchema>) => {
    manualCheckInMutation.mutate({
      ...values,
      eventId: selectedEvent || values.eventId,
    });
  };

  const activeEvents = events.filter((event: Event) => 
    event.status === 'approved' && new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date()
  );

  const selectedEventData = events.find((event: Event) => event.id === selectedEvent);

  if (!user || !['admin', 'teacher', 'registrar', 'technical_staff'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin, teacher, registrar, or technical staff privileges to access the RSVP scanner.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">RSVP Scanner</h1>
          <Badge variant="outline" className="text-sm">
            <Scan className="h-3 w-3 mr-1" />
            Event Check-in
          </Badge>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>Choose an active event to start scanning RSVPs</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setSelectedEvent(parseInt(value))} value={selectedEvent?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select an active event" />
              </SelectTrigger>
              <SelectContent>
                {activeEvents.map((event: Event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title} - {format(new Date(event.startDate), "PPP")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEvent && selectedEventData && (
          <>
            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {selectedEventData.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(selectedEventData.startDate), "PPP p")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEventData.location || 'Location TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {checkedInCount} / {eventRsvps.length} checked in
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Scanner */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Scan RSVP
                  </CardTitle>
                  <CardDescription>
                    Enter or scan the RSVP number to check in attendees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...scanForm}>
                    <form onSubmit={scanForm.handleSubmit(onScanSubmit)} className="space-y-4">
                      <FormField
                        control={scanForm.control}
                        name="rsvpNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RSVP Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter RSVP number..." 
                                {...field}
                                className="text-center font-mono text-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={scanRsvpMutation.isPending}
                        className="w-full"
                        size="lg"
                      >
                        {scanRsvpMutation.isPending ? "Scanning..." : "Scan RSVP"}
                      </Button>
                    </form>
                  </Form>

                  {/* Scan Result */}
                  {scanResult && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-1">
                          <p className="font-medium">{scanResult.user.fullName}</p>
                          <p className="text-sm">{scanResult.user.email}</p>
                          <p className="text-sm">RSVP: {scanResult.rsvpNumber}</p>
                          {scanResult.checkedInAt && (
                            <p className="text-sm">
                              Checked in: {format(new Date(scanResult.checkedInAt), "PPP p")}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {scanError && (
                    <Alert className="mt-4 border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {scanError}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Manual Check-in */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Manual Check-in
                  </CardTitle>
                  <CardDescription>
                    Check in attendees manually using their email address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...manualForm}>
                    <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
                      <FormField
                        control={manualForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="attendee@college.edu" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={manualCheckInMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        {manualCheckInMutation.isPending ? "Checking in..." : "Manual Check-in"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* RSVP List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event RSVPs</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  View and manage all RSVPs for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventRsvps.map((rsvp: RsvpRecord) => (
                    <div key={rsvp.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${rsvp.checkedIn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div>
                          <p className="font-medium">{rsvp.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{rsvp.user.email}</p>
                          <p className="text-xs text-muted-foreground">RSVP: {rsvp.rsvpNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={rsvp.checkedIn ? "default" : "secondary"}>
                          {rsvp.checkedIn ? "Checked In" : "Pending"}
                        </Badge>
                        {rsvp.checkedInAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(rsvp.checkedInAt), "MMM d, p")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {eventRsvps.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No RSVPs found for this event</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedEvent && (
          <Card>
            <CardContent className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select an Event</h2>
              <p className="text-muted-foreground">Choose an active event from the dropdown above to start scanning RSVPs</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default RsvpScanner;