import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourceWithBookings } from "@/lib/types";

interface ResourceCardProps {
  resource: ResourceWithBookings;
  onBook?: (resource: ResourceWithBookings) => void;
}

export function ResourceCard({ resource, onBook }: ResourceCardProps) {
  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? 'bg-success/10 text-success' : 'bg-error/10 text-error';
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Available' : 'Occupied';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-base font-semibold text-neutral-800 dark:text-white">
            {resource.name}
          </CardTitle>
          <Badge className={getStatusColor(resource.isAvailable)}>
            {getStatusText(resource.isAvailable)}
          </Badge>
        </div>
        
        <p className="text-sm text-neutral-600 dark:text-gray-300 mb-3">
          {resource.description}
          {resource.capacity && `, Capacity: ${resource.capacity} seats`}
        </p>
        
        <div className="text-xs text-neutral-500 dark:text-gray-400 mb-3 space-y-1">
          {resource.isAvailable ? (
            <>
              <p>Next available: Now</p>
              {resource.costPerHour && (
                <p>Cost: ${resource.costPerHour}/hour</p>
              )}
            </>
          ) : (
            <>
              <p>Currently occupied</p>
              <p>Check back later</p>
            </>
          )}
        </div>
        
        <Button
          onClick={() => onBook?.(resource)}
          disabled={!resource.isAvailable}
          className={`w-full ${
            resource.isAvailable
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
          }`}
        >
          {resource.isAvailable ? 'Book Now' : 'Currently Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
}
