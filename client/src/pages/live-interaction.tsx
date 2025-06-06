import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Vote, Camera, BarChart3, Users, TrendingUp, Clock, 
  CheckCircle, Eye, Share2, Download, Upload, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const pollResponseSchema = z.object({
  selectedOption: z.number().min(0, "Please select an option"),
});

const photoUploadSchema = z.object({
  caption: z.string().optional(),
  eventId: z.number(),
});

interface LiveEvent {
  id: number;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  isLive: boolean;
}

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  eventId: number;
  visibleToAttendeesOnly: boolean;
  responses?: PollResponse[];
}

interface PollResponse {
  id: number;
  pollId: number;
  userId: number;
  selectedOption: number;
  user?: { name: string };
}

interface EventPhoto {
  id: number;
  eventId: number;
  userId: number;
  imageUrl: string;
  caption?: string;
  isApproved: boolean;
  uploadedAt: string;
  user?: { name: string };
}

export default function LiveInteraction() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [photoUploadDialog, setPhotoUploadDialog] = useState(false);

  // Queries
  const { data: liveEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events/live"],
  });

  const { data: eventPolls = [], refetch: refetchPolls } = useQuery({
    queryKey: ["/api/events", selectedEvent?.id, "polls"],
    enabled: !!selectedEvent,
  });

  const { data: pollResults = [] } = useQuery({
    queryKey: ["/api/polls", selectedPoll?.id, "results"],
    enabled: !!selectedPoll,
    refetchInterval: 2000, // Real-time updates every 2 seconds
  });

  const { data: eventPhotos = [] } = useQuery({
    queryKey: ["/api/events", selectedEvent?.id, "photos"],
    enabled: !!selectedEvent,
  });

  const { data: eventAnalytics } = useQuery({
    queryKey: ["/api/events", selectedEvent?.id, "analytics"],
    enabled: !!selectedEvent && user && ['admin', 'teacher', 'registrar', 'club_head'].includes(user.role),
  });

  // Forms
  const pollForm = useForm<z.infer<typeof pollResponseSchema>>({
    resolver: zodResolver(pollResponseSchema),
  });

  const photoForm = useForm<z.infer<typeof photoUploadSchema>>({
    resolver: zodResolver(photoUploadSchema),
    defaultValues: {
      eventId: selectedEvent?.id || 0,
    },
  });

  // Mutations
  const pollResponseMutation = useMutation({
    mutationFn: ({ pollId, data }: { pollId: number; data: any }) =>
      apiRequest(`/api/polls/${pollId}/respond`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      toast({ description: "Your vote has been recorded!" });
      pollForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Failed to submit vote. You may have already voted." 
      });
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/events/${selectedEvent?.id}/photos`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", selectedEvent?.id, "photos"] });
      toast({ description: "Photo uploaded successfully!" });
      setPhotoUploadDialog(false);
      photoForm.reset();
    },
  });

  // Real-time polling updates
  useEffect(() => {
    if (selectedEvent && selectedEvent.isLive) {
      const interval = setInterval(() => {
        refetchPolls();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent, refetchPolls]);

  const onPollSubmit = (values: z.infer<typeof pollResponseSchema>) => {
    if (!selectedPoll) return;
    pollResponseMutation.mutate({
      pollId: selectedPoll.id,
      data: values,
    });
  };

  const onPhotoUpload = (values: z.infer<typeof photoUploadSchema>) => {
    const photoData = {
      ...values,
      eventId: selectedEvent?.id,
      imageUrl: "/placeholder-photo.jpg", // In real implementation, handle file upload
    };
    photoUploadMutation.mutate(photoData);
  };

  const calculatePollResults = (poll: Poll, responses: PollResponse[]) => {
    const totalVotes = responses.length;
    const optionCounts = poll.options.map((_, index) => 
      responses.filter(r => r.selectedOption === index).length
    );
    
    return optionCounts.map((count, index) => ({
      option: poll.options[index],
      count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    }));
  };

  const canParticipate = (poll: Poll) => {
    if (!user) return false;
    if (poll.visibleToAttendeesOnly) {
      // Check if user has RSVP'd for the event
      return true; // Simplified for demo
    }
    return true;
  };

  const hasVoted = (poll: Poll, responses: PollResponse[]) => {
    return responses.some(r => r.userId === user?.id);
  };

  if (eventsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading live events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Live Event Interaction</h1>
        <Badge variant="outline" className="animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Live
        </Badge>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Active Events</CardTitle>
          <CardDescription>Select an event to participate in live interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((event: LiveEvent) => (
              <Card 
                key={event.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedEvent(event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant={event.isLive ? "default" : "secondary"}>
                      {event.isLive ? "Live" : "Scheduled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(event.startDate), "PPP p")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <Tabs defaultValue="polls" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="polls">Live Polls</TabsTrigger>
            <TabsTrigger value="photos">Event Photos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          {/* Live Polls */}
          <TabsContent value="polls" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Live Polls</h3>
              <Button
                onClick={() => refetchPolls()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {eventPolls.map((poll: Poll) => {
                const results = calculatePollResults(poll, pollResults);
                const userHasVoted = hasVoted(poll, pollResults);
                const canVote = canParticipate(poll) && !userHasVoted && poll.isActive;

                return (
                  <Card key={poll.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{poll.question}</CardTitle>
                        <div className="flex gap-2">
                          {userHasVoted && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Voted
                            </Badge>
                          )}
                          <Badge variant={poll.isActive ? "default" : "secondary"}>
                            {poll.isActive ? "Active" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {canVote ? (
                        <Form {...pollForm}>
                          <form onSubmit={pollForm.handleSubmit(onPollSubmit)} className="space-y-4">
                            <FormField
                              control={pollForm.control}
                              name="selectedOption"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                      value={field.value?.toString()}
                                    >
                                      {poll.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <RadioGroupItem value={index.toString()} />
                                          <Label>{option}</Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={pollResponseMutation.isPending}
                              onClick={() => setSelectedPoll(poll)}
                            >
                              {pollResponseMutation.isPending ? "Submitting..." : "Submit Vote"}
                            </Button>
                          </form>
                        </Form>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground mb-2">
                            Poll Results ({pollResults.length} votes)
                          </div>
                          {results.map((result, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{result.option}</span>
                                <span>{result.percentage}% ({result.count})</span>
                              </div>
                              <Progress value={result.percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Event Photos */}
          <TabsContent value="photos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Event Photos</h3>
              <Dialog open={photoUploadDialog} onOpenChange={setPhotoUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Event Photo</DialogTitle>
                    <DialogDescription>
                      Share your event moments with other attendees
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...photoForm}>
                    <form onSubmit={photoForm.handleSubmit(onPhotoUpload)} className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                      </div>
                      
                      <FormField
                        control={photoForm.control}
                        name="caption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Caption (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Add a caption..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={photoUploadMutation.isPending} className="w-full">
                        {photoUploadMutation.isPending ? "Uploading..." : "Upload Photo"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventPhotos.map((photo: EventPhoto) => (
                <Card key={photo.id}>
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      {photo.caption && (
                        <p className="text-sm mb-2">{photo.caption}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>By {photo.user?.name || 'Anonymous'}</span>
                        <span>{format(new Date(photo.uploadedAt), "PPP")}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Real-time Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <h3 className="text-xl font-semibold">Real-time Analytics</h3>
            
            {user && ['admin', 'teacher', 'registrar', 'club_head'].includes(user.role) ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{eventAnalytics?.totalRegistrations || 0}</div>
                    <p className="text-xs text-muted-foreground">+12% from last hour</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Poll Participation</CardTitle>
                    <Vote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pollResults.length}</div>
                    <p className="text-xs text-muted-foreground">Active voters</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Photos Shared</CardTitle>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{eventPhotos.length}</div>
                    <p className="text-xs text-muted-foreground">Total uploads</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">Above average</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Analytics view requires elevated permissions</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Engagement Dashboard */}
          <TabsContent value="engagement" className="space-y-4">
            <h3 className="text-xl font-semibold">Engagement Dashboard</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Activity Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>New poll response from John D.</span>
                      <span className="text-muted-foreground">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Photo uploaded by Sarah M.</span>
                      <span className="text-muted-foreground">5 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>New attendee checked in</span>
                      <span className="text-muted-foreground">8 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interaction Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Real-time engagement visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}