import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResourceWithBookings } from "@/types";

interface ResourceCardProps {
  resource: ResourceWithBookings;
  onBook?: (resourceId: number) => void;
  showBookButton?: boolean;
}

export function ResourceCard({ resource, onBook, showBookButton = true }: ResourceCardProps) {
  const getStatusIcon = () => {
    if (resource.isAvailable) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    } else if (resource.nextAvailable) {
      return <AlertCircle className="h-4 w-4 text-warning" />;
    } else {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    if (resource.isAvailable) {
      return <Badge className="status-badge approved">Available</Badge>;
    } else if (resource.nextAvailable) {
      return <Badge className="status-badge pending">Limited</Badge>;
    } else {
      return <Badge className="status-badge rejected">Occupied</Badge>;
    }
  };

  const getStatusText = () => {
    if (resource.isAvailable) {
      return "Ready for booking";
    } else if (resource.nextAvailable) {
      return `Available from: ${resource.nextAvailable}`;
    } else if (resource.currentBooking) {
      return `Occupied by: ${resource.currentBooking}`;
    }
    return "Currently unavailable";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{resource.name}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {resource.description}
        </p>

        {resource.capacity && (
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Capacity: {resource.capacity} {resource.type === "room" ? "seats" : "units"}
            </span>
          </div>
        )}

        {resource.location && (
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Location: {resource.location}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2 mb-4">
          {getStatusIcon()}
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
        </div>

        {showBookButton && (
          <Button
            className="w-full"
            onClick={() => onBook?.(resource.id)}
            disabled={!resource.isAvailable}
            variant={resource.isAvailable ? "default" : "secondary"}
          >
            {resource.isAvailable ? "Book Now" : "Currently Unavailable"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
