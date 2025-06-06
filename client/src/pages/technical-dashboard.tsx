import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Settings, Building, Monitor, Plus, 
  Edit, Wrench, CheckCircle, AlertTriangle
} from "lucide-react";

export default function TechnicalDashboard() {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalEquipment: 0,
    activeBookings: 0,
    maintenanceNeeded: 0
  });

  const [newVenue, setNewVenue] = useState({
    name: '',
    type: 'classroom',
    description: '',
    capacity: '',
    location: '',
    features: '',
    isAvailable: true
  });

  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: 'audio_visual',
    description: '',
    quantity: '',
    condition: 'excellent',
    isAvailable: true
  });

  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);

  useEffect(() => {
    fetchVenues();
    fetchEquipment();
    fetchBookings();
    fetchStats();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await fetch("/api/venues", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      }
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/technical/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch technical stats:", error);
    }
  };

  const handleCreateVenue = async () => {
    try {
      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newVenue,
          capacity: parseInt(newVenue.capacity),
          features: newVenue.features.split(',').map(f => f.trim()).filter(f => f)
        }),
      });

      if (response.ok) {
        setNewVenue({
          name: '',
          type: 'classroom',
          description: '',
          capacity: '',
          location: '',
          features: '',
          isAvailable: true
        });
        fetchVenues();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to create venue:", error);
    }
  };

  const handleUpdateVenue = async (venueId: number, updates: any) => {
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingVenue(null);
        fetchVenues();
      }
    } catch (error) {
      console.error("Failed to update venue:", error);
    }
  };

  const handleCreateEquipment = async () => {
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newEquipment,
          quantity: parseInt(newEquipment.quantity)
        }),
      });

      if (response.ok) {
        setNewEquipment({
          name: '',
          type: 'audio_visual',
          description: '',
          quantity: '',
          condition: 'excellent',
          isAvailable: true
        });
        fetchEquipment();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to create equipment:", error);
    }
  };

  const handleUpdateEquipment = async (equipmentId: number, updates: any) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingEquipment(null);
        fetchEquipment();
      }
    } catch (error) {
      console.error("Failed to update equipment:", error);
    }
  };

  if (user?.role !== 'technical_staff') {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-red-600">Access Denied: Technical staff privileges required</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Technical Dashboard</h1>
          <p className="text-muted-foreground">
            Manage venues, equipment, and technical resources
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Venues</p>
                  <p className="text-2xl font-bold">{venues.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Equipment</p>
                  <p className="text-2xl font-bold">{equipment.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maintenance Needed</p>
                  <p className="text-2xl font-bold">
                    {equipment.filter((item: any) => item.condition === 'needs_repair').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="venues" className="space-y-6">
          <TabsList>
            <TabsTrigger value="venues">Venue Management</TabsTrigger>
            <TabsTrigger value="equipment">Equipment Management</TabsTrigger>
            <TabsTrigger value="bookings">Bookings & Schedule</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="venues" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Venue Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Venue
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Venue</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="venue-name">Name</Label>
                        <Input
                          id="venue-name"
                          value={newVenue.name}
                          onChange={(e) => setNewVenue({...newVenue, name: e.target.value})}
                          placeholder="Enter venue name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venue-type">Type</Label>
                        <Select 
                          value={newVenue.type} 
                          onValueChange={(value) => setNewVenue({...newVenue, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select venue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classroom">Classroom</SelectItem>
                            <SelectItem value="auditorium">Auditorium</SelectItem>
                            <SelectItem value="laboratory">Laboratory</SelectItem>
                            <SelectItem value="sports_complex">Sports Complex</SelectItem>
                            <SelectItem value="open_ground">Open Ground</SelectItem>
                            <SelectItem value="conference_room">Conference Room</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="venue-capacity">Capacity</Label>
                        <Input
                          id="venue-capacity"
                          type="number"
                          value={newVenue.capacity}
                          onChange={(e) => setNewVenue({...newVenue, capacity: e.target.value})}
                          placeholder="Enter capacity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venue-location">Location</Label>
                        <Input
                          id="venue-location"
                          value={newVenue.location}
                          onChange={(e) => setNewVenue({...newVenue, location: e.target.value})}
                          placeholder="Building, Floor, Room"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venue-description">Description</Label>
                        <Textarea
                          id="venue-description"
                          value={newVenue.description}
                          onChange={(e) => setNewVenue({...newVenue, description: e.target.value})}
                          placeholder="Enter description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venue-features">Features (comma-separated)</Label>
                        <Input
                          id="venue-features"
                          value={newVenue.features}
                          onChange={(e) => setNewVenue({...newVenue, features: e.target.value})}
                          placeholder="AC, Projector, WiFi, etc."
                        />
                      </div>
                      <Button onClick={handleCreateVenue} className="w-full">
                        Create Venue
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venues.map((venue: any) => (
                    <Card key={venue.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{venue.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVenue(venue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{venue.description}</p>
                        <div className="space-y-1 text-sm">
                          <p><strong>Type:</strong> {venue.type}</p>
                          <p><strong>Capacity:</strong> {venue.capacity}</p>
                          <p><strong>Location:</strong> {venue.location}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant={venue.isAvailable ? "default" : "secondary"}>
                              {venue.isAvailable ? "Available" : "Occupied"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateVenue(venue.id, { 
                                isAvailable: !venue.isAvailable 
                              })}
                            >
                              {venue.isAvailable ? "Mark Occupied" : "Mark Available"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Equipment Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Equipment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="equipment-name">Name</Label>
                        <Input
                          id="equipment-name"
                          value={newEquipment.name}
                          onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                          placeholder="Enter equipment name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="equipment-type">Type</Label>
                        <Select 
                          value={newEquipment.type} 
                          onValueChange={(value) => setNewEquipment({...newEquipment, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="audio_visual">Audio Visual</SelectItem>
                            <SelectItem value="computer">Computer</SelectItem>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="laboratory">Laboratory</SelectItem>
                            <SelectItem value="lighting">Lighting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="equipment-quantity">Quantity</Label>
                        <Input
                          id="equipment-quantity"
                          type="number"
                          value={newEquipment.quantity}
                          onChange={(e) => setNewEquipment({...newEquipment, quantity: e.target.value})}
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="equipment-condition">Condition</Label>
                        <Select 
                          value={newEquipment.condition} 
                          onValueChange={(value) => setNewEquipment({...newEquipment, condition: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="needs_repair">Needs Repair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="equipment-description">Description</Label>
                        <Textarea
                          id="equipment-description"
                          value={newEquipment.description}
                          onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                          placeholder="Enter description"
                        />
                      </div>
                      <Button onClick={handleCreateEquipment} className="w-full">
                        Create Equipment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map((item: any) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEquipment(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="space-y-1 text-sm">
                          <p><strong>Type:</strong> {item.type}</p>
                          <p><strong>Quantity:</strong> {item.quantity}</p>
                          <p><strong>Condition:</strong> {item.condition}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant={
                              item.condition === 'needs_repair' ? 'destructive' :
                              item.isAvailable ? 'default' : 'secondary'
                            }>
                              {item.condition === 'needs_repair' ? 'Needs Repair' :
                               item.isAvailable ? 'Available' : 'In Use'}
                            </Badge>
                            {item.condition !== 'needs_repair' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateEquipment(item.id, { 
                                  isAvailable: !item.isAvailable 
                                })}
                              >
                                {item.isAvailable ? "Mark In Use" : "Mark Available"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Resource Bookings & Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Booking schedule management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment.filter((item: any) => item.condition === 'needs_repair').length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No equipment needs repair
                    </p>
                  ) : (
                    equipment
                      .filter((item: any) => item.condition === 'needs_repair')
                      .map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <Badge variant="destructive">Needs Repair</Badge>
                          </div>
                          <Button
                            onClick={() => handleUpdateEquipment(item.id, { condition: 'good' })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Repaired
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}