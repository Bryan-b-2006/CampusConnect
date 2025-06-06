import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, MapPin, Users, Clock, Plus, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NavigationHeader } from "@/components/navigation-header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Event, Venue, Equipment } from "@shared/schema";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  maxAttendees: z.number().optional(),
  budget: z.number().optional(),
  eventType: z.string().default("audience"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface VenueAvailability {
  venueId: number;
  available: boolean;
  conflictingEvents?: string[];
}

interface EquipmentAvailability {
  equipmentId: number;
  available: boolean;
  availableQuantity: number;
}

export default function EnhancedEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const [venueAvailability, setVenueAvailability] = useState<VenueAvailability[]>([]);
  const [equipmentAvailability, setEquipmentAvailability] = useState<EquipmentAvailability[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Fetch venues
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
    enabled: ['admin', 'teacher', 'hod', 'club_head', 'technical_staff'].includes(user?.role || ''),
  });

  // Fetch equipment
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    enabled: ['admin', 'teacher', 'hod', 'club_head', 'technical_staff'].includes(user?.role || ''),
  });

  // Check venue availability when dates change
  useEffect(() => {
    if (startDate && endDate && venues.length > 0) {
      checkVenueAvailability();
    }
  }, [startDate, endDate, venues]);

  // Check equipment availability when dates change
  useEffect(() => {
    if (startDate && endDate && equipment.length > 0) {
      checkEquipmentAvailability();
    }
  }, [startDate, endDate, equipment]);

  const checkVenueAvailability = async () => {
    try {
      const availabilityPromises = venues.map(async (venue) => {
        const response = await fetch(
          `/api/venues/${venue.id}/availability?startTime=${startDate}&endTime=${endDate}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        return {
          venueId: venue.id,
          available: data.available,
          conflictingEvents: data.conflictingEvents || [],
        };
      });

      const availability = await Promise.all(availabilityPromises);
      setVenueAvailability(availability);
    } catch (error) {
      console.error("Failed to check venue availability:", error);
    }
  };

  const checkEquipmentAvailability = async () => {
    try {
      const availabilityPromises = equipment.map(async (eq) => {
        const response = await fetch(
          `/api/equipment/${eq.id}/availability?quantity=1&startTime=${startDate}&endTime=${endDate}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        return {
          equipmentId: eq.id,
          available: data.available,
          availableQuantity: data.availableQuantity || 0,
        };
      });

      const availability = await Promise.all(availabilityPromises);
      setEquipmentAvailability(availability);
    } catch (error) {
      console.error("Failed to check equipment availability:", error);
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData & { venueId?: number; equipmentIds?: number[] }) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          organizerId: user?.id,
          venueId: selectedVenue,
          equipmentRequired: selectedEquipment.map(id => 
            equipment.find(eq => eq.id === id)?.name || ''
          ).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateDialogOpen(false);
      reset();
      setSelectedVenue(null);
      setSelectedEquipment([]);
      toast({
        title: "Event Created",
        description: "Your event has been created and sent for approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    if (!selectedVenue) {
      toast({
        title: "Venue Required",
        description: "Please select a venue for your event",
        variant: "destructive",
      });
      return;
    }

    const venueAvail = venueAvailability.find(v => v.venueId === selectedVenue);
    if (venueAvail && !venueAvail.available) {
      toast({
        title: "Venue Unavailable",
        description: "The selected venue is not available during the chosen time",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      ...data,
      maxAttendees: data.maxAttendees || undefined,
      budget: data.budget || undefined,
      venueId: selectedVenue,
      equipmentIds: selectedEquipment,
    });
  };

  const getVenueAvailabilityStatus = (venueId: number) => {
    const availability = venueAvailability.find(v => v.venueId === venueId);
    if (!availability) return null;
    return availability.available ? "available" : "unavailable";
  };

  const getEquipmentAvailabilityStatus = (equipmentId: number) => {
    const availability = equipmentAvailability.find(e => e.equipmentId === equipmentId);
    if (!availability) return null;
    return availability.available ? "available" : "unavailable";
  };

  if (!['admin', 'teacher', 'hod', 'club_head', 'club_member'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
                Access Denied
              </h2>
              <p className="text-neutral-600 dark:text-gray-300">
                You don't have permission to create events.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <NavigationHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-800 dark:text-white">
              Event Management
            </h2>
            <p className="text-neutral-600 dark:text-gray-300">
              Create and manage events with resource availability checking
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in the event details and check resource availability
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="Enter event title"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => register("category").onChange({ target: { value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your event"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...register("startDate")}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...register("endDate")}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Venue Selection */}
                {venues.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select Venue</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {venues.map((venue) => {
                        const status = getVenueAvailabilityStatus(venue.id);
                        const isSelected = selectedVenue === venue.id;

                        return (
                          <Card
                            key={venue.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            } ${status === 'unavailable' ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (status !== 'unavailable') {
                                setSelectedVenue(venue.id);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{venue.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {venue.type} • Capacity: {venue.capacity}
                                  </p>
                                </div>
                                {status && (
                                  <Badge
                                    variant={status === 'available' ? 'default' : 'destructive'}
                                  >
                                    {status === 'available' ? (
                                      <Check className="w-3 h-3 mr-1" />
                                    ) : (
                                      <X className="w-3 h-3 mr-1" />
                                    )}
                                    {status}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Equipment Selection */}
                {equipment.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select Equipment (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {equipment.map((eq) => {
                        const status = getEquipmentAvailabilityStatus(eq.id);
                        const isSelected = selectedEquipment.includes(eq.id);

                        return (
                          <Card
                            key={eq.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            } ${status === 'unavailable' ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (status !== 'unavailable') {
                                setSelectedEquipment(prev =>
                                  isSelected
                                    ? prev.filter(id => id !== eq.id)
                                    : [...prev, eq.id]
                                );
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{eq.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {eq.type} • Available: {eq.availableQuantity}/{eq.quantity}
                                  </p>
                                </div>
                                {status && (
                                  <Badge
                                    variant={status === 'available' ? 'default' : 'destructive'}
                                  >
                                    {status === 'available' ? (
                                      <Check className="w-3 h-3 mr-1" />
                                    ) : (
                                      <X className="w-3 h-3 mr-1" />
                                    )}
                                    {status}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">Max Attendees (Optional)</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      {...register("maxAttendees", { valueAsNumber: true })}
                      placeholder="Enter maximum attendees"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (Optional)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      {...register("budget", { valueAsNumber: true })}
                      placeholder="Enter budget amount"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEventMutation.isPending}
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}