import { Calendar, Clock, MapPin, Users, DollarSign, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventWithDetails } from "@/types";

interface EventCardProps {
  event: EventWithDetails;
  onRsvp?: (eventId: number) => void;
  onManage?: (eventId: number) => void;
  showActions?: boolean;
}

export function EventCard({ event, onRsvp, onManage, showActions = true }: EventCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="status-badge approved">Approved</Badge>;
      case "pending":
        return <Badge className="status-badge pending">Pending Review</Badge>;
      case "rejected":
        return <Badge className="status-badge rejected">Rejected</Badge>;
      case "draft":
        return <Badge className="status-badge draft">Draft</Badge>;
      case "completed":
        return <Badge className="status-badge completed">Completed</Badge>;
      case "cancelled":
        return <Badge className="status-badge cancelled">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return "bg-gradient-to-br from-blue-500 to-blue-600";
      case "cultural":
        return "bg-gradient-to-br from-amber-500 to-yellow-600";
      case "sports":
        return "bg-gradient-to-br from-green-500 to-green-600";
      case "academic":
        return "bg-gradient-to-br from-purple-500 to-purple-600";
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "technical":
        return "fas fa-code";
      case "cultural":
        return "fas fa-music";
      case "sports":
        return "fas fa-running";
      case "academic":
        return "fas fa-graduation-cap";
      default:
        return "fas fa-calendar";
    }
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            {/* Event icon */}
            <div className={`w-16 h-16 ${getCategoryColor(event.category)} rounded-lg flex items-center justify-center`}>
              <i className={`${getCategoryIcon(event.category)} text-white text-xl`}></i>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-foreground">{event.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {event.club?.name || event.organizer?.fullName}
              </p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
                {event.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(event.status || "pending")}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <strong>{event.rsvpCount || 0}</strong> RSVPs
              </span>
            </div>
            {event.budget && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Budget: <strong>${event.budget}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <strong>0</strong> likes
              </span>
            </div>
          </div>
          
          {showActions && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              {onRsvp && event.status === "approved" && (
                <Button 
                  size="sm" 
                  onClick={() => onRsvp(event.id)}
                  variant={event.isRsvped ? "secondary" : "default"}
                >
                  {event.isRsvped ? "RSVP'd ✓" : "RSVP"}
                </Button>
              )}
              {onManage && (
                <Button size="sm" onClick={() => onManage(event.id)}>
                  Manage
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
