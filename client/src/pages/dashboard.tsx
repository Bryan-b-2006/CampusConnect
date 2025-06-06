import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Users, MapPin, Clock, 
  Heart, MessageCircle, Share2
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  venue: string;
  maxAttendees?: number;
  status: string;
  eventType: string;
  organizerName: string;
}

interface SocialPost {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  likes?: number;
  comments?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [userRSVPs, setUserRSVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch upcoming events
      const eventsResponse = await fetch("/api/events?status=approved&upcoming=true", { headers });
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.slice(0, 5)); // Show only 5 recent events

      // Fetch social posts
      const postsResponse = await fetch("/api/social-posts?limit=10", { headers });
      const postsData = await postsResponse.json();
      setSocialPosts(postsData.slice(0, 5)); // Show only 5 recent posts

      // Fetch user's RSVPs
      const rsvpResponse = await fetch("/api/rsvps/my-rsvps", { headers });
      const rsvpData = await rsvpResponse.json();
      setUserRSVPs(rsvpData);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "attending",
          registrationType: "audience"
        }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-neutral-600 dark:text-gray-300 mt-2">
            Stay updated with campus events and activities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-muted-foreground">No upcoming events</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="outline">{event.eventType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.venue}
                          </div>
                          {event.maxAttendees && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Max {event.maxAttendees}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            By {event.organizerName}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleRSVP(event.id)}
                            disabled={userRSVPs.some(rsvp => rsvp.eventId === event.id)}
                          >
                            {userRSVPs.some(rsvp => rsvp.eventId === event.id) ? "RSVP'd" : "RSVP"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Social Feed Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Campus Feed</CardTitle>
              </CardHeader>
              <CardContent>
                {socialPosts.length === 0 ? (
                  <p className="text-muted-foreground">No recent posts</p>
                ) : (
                  <div className="space-y-4">
                    {socialPosts.map((post) => (
                      <div key={post.id} className="border-b pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                            {post.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{post.author}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-gray-400">
                          <button className="flex items-center space-x-1 hover:text-red-500">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-green-500">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}