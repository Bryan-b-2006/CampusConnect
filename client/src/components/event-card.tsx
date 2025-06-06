import { Calendar, Clock, MapPin, Users, DollarSign, ThumbsUp, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventWithDetails } from "@/lib/types";
import { format } from "date-fns";

interface EventCardProps {
  event: EventWithDetails;
  onView?: (event: EventWithDetails) => void;
  onManage?: (event: EventWithDetails) => void;
}

export function EventCard({ event, onView, onManage }: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'rejected':
        return 'bg-error/10 text-error';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return '💻';
      case 'cultural':
        return '🎭';
      case 'sports':
        return '⚽';
      case 'academic':
        return '📚';
      case 'social':
        return '🎉';
      default:
        return '📅';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center text-2xl">
              {getCategoryIcon(event.category)}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-neutral-800 dark:text-white">{event.title}</h4>
              <p className="text-sm text-neutral-600 dark:text-gray-300 mb-2">
                {event.club?.name || 'Independent Event'}
              </p>
              <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(event.startDate), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
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
            <Badge className={getStatusColor(event.status)}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {event.description && (
          <p className="text-sm text-neutral-600 dark:text-gray-300 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-600 dark:text-gray-300">
                <strong>{event.rsvpCount || 0}</strong> RSVPs
              </span>
            </div>
            {event.budget && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600 dark:text-gray-300">
                  Budget: <strong>${event.budget}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-600 dark:text-gray-300">
                <strong>0</strong> likes
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(event)}>
                View Details
              </Button>
            )}
            {onManage && (
              <Button size="sm" onClick={() => onManage(event)}>
                Manage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
