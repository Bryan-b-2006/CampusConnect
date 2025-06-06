import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, 
  AlertTriangle, BookOpen, Award 
} from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState({
    eventsToReview: 0,
    eventsApproved: 0,
    eventsOrganized: 0,
    studentsSupervised: 0
  });

  useEffect(() => {
    fetchPendingApprovals();
    fetchMyEvents();
    fetchStats();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch("/api/teacher/pending-approvals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await fetch(`/api/events?organizerId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch my events:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/teacher/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch teacher stats:", error);
    }
  };

  const handleApproveEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          status: 'approved',
          comments: "Approved by teacher" 
        }),
      });

      if (response.ok) {
        fetchPendingApprovals();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to approve event:", error);
    }
  };

  const handleRejectEvent = async (eventId: number, reason: string) => {
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          status: 'rejected',
          comments: reason 
        }),
      });

      if (response.ok) {
        fetchPendingApprovals();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to reject event:", error);
    }
  };

  if (!['teacher', 'hod'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-red-600">Access Denied: Teacher privileges required</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {user?.role === 'hod' ? 'HOD Dashboard' : 'Teacher Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Review events and manage your activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Events to Review</p>
                  <p className="text-2xl font-bold">{pendingEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Events Approved</p>
                  <p className="text-2xl font-bold">{stats.eventsApproved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Events Organized</p>
                  <p className="text-2xl font-bold">{myEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students Supervised</p>
                  <p className="text-2xl font-bold">{stats.studentsSupervised}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">Event Approvals</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="supervision">Student Supervision</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Events Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No events pending approval
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm">
                              📅 {new Date(event.startDate).toLocaleDateString()}
                            </span>
                            <span className="text-sm">📍 {event.venue}</span>
                            <Badge variant="outline">{event.eventType}</Badge>
                            <span className="text-sm">
                              👥 Max: {event.maxAttendees || 'Unlimited'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm">
                              <strong>Organizer:</strong> {event.organizer?.fullName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleApproveEvent(event.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Please provide a reason for rejection:");
                              if (reason) {
                                handleRejectEvent(event.id, reason);
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Organized Events</CardTitle>
              </CardHeader>
              <CardContent>
                {myEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No events organized yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myEvents.map((event: any) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                            <p>📍 {event.venue}</p>
                            <p>🎯 {event.eventType}</p>
                            <Badge variant={
                              event.status === 'approved' ? 'default' :
                              event.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {event.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supervision">
            <Card>
              <CardHeader>
                <CardTitle>Student Supervision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Student supervision features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}