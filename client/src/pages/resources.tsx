import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NavigationHeader } from "@/components/navigation-header";
import { ResourceCard } from "@/components/resource-card";
import { useAuth } from "@/hooks/useAuth";
import { ResourceWithBookings } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceWithBookings | null>(null);
  const [bookingData, setBookingData] = useState({
    startTime: "",
    endTime: "",
    date: "",
    notes: "",
  });

  const { data: resources = [], isLoading, refetch } = useQuery<ResourceWithBookings[]>({
    queryKey: ["/api/resources"],
  });

  const filteredResources = resources.filter(resource => {
    if (typeFilter !== "all" && resource.type !== typeFilter) return false;
    return true;
  });

  const resourceTypes = [
    { value: "auditorium", label: "Auditoriums" },
    { value: "conference_room", label: "Conference Rooms" },
    { value: "equipment", label: "Equipment" },
    { value: "catering", label: "Catering" },
  ];

  const handleBookResource = (resource: ResourceWithBookings) => {
    setSelectedResource(resource);
    setIsBookingModalOpen(true);
  };

  const handleSubmitBooking = async () => {
    if (!selectedResource || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}`);

      await apiRequest("POST", `/api/resources/${selectedResource.id}/book`, {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: bookingData.notes,
      });

      toast({
        title: "Booking submitted",
        description: "Your resource booking request has been submitted for approval.",
      });

      setIsBookingModalOpen(false);
      setSelectedResource(null);
      setBookingData({ startTime: "", endTime: "", date: "", notes: "" });
      refetch();
    } catch (error) {
      console.error("Failed to book resource:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking request",
        variant: "destructive",
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'auditorium':
        return '🏛️';
      case 'conference_room':
        return '🏢';
      case 'equipment':
        return '🎤';
      case 'catering':
        return '🍽️';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Resources</h1>
          <p className="text-neutral-600 dark:text-gray-300 mt-2">
            Book college resources for your events and activities
          </p>
        </div>

        {/* Resource Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {resourceTypes.map((type) => {
            const typeResources = resources.filter(r => r.type === type.value);
            const availableCount = typeResources.filter(r => r.isAvailable).length;
            
            return (
              <Card key={type.value}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-neutral-800 dark:text-white">
                        {availableCount}/{typeResources.length}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-gray-300">
                        {type.label}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                      {getResourceIcon(type.value)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge 
                      variant="secondary"
                      className={availableCount > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
                    >
                      {availableCount > 0 ? 'Available' : 'All Booked'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2 block">
                  Resource Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {resourceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setTypeFilter("all")}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource}
                onBook={handleBookResource}
              />
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-neutral-600 dark:text-gray-300">
                    No resources found matching your criteria.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Resource</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedResource && (
              <div className="p-4 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-neutral-800 dark:text-white">
                  {selectedResource.name}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-gray-300">
                  {selectedResource.description}
                </p>
                {selectedResource.costPerHour && (
                  <p className="text-sm text-neutral-600 dark:text-gray-300">
                    Cost: ${selectedResource.costPerHour}/hour
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={bookingData.endTime}
                  onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or notes..."
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitBooking} className="flex-1">
                Submit Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
