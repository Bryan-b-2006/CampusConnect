import { Plus, CalendarCheck, Clock, CheckCircle, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  onCreateEvent: () => void;
}

export function Sidebar({ onCreateEvent }: SidebarProps) {
  const { user } = useAuth();

  const canCreateEvents = user?.role && ['club_member', 'club_head', 'teacher', 'admin'].includes(user.role);
  const canManageClub = user?.role && ['club_head', 'admin'].includes(user.role);

  return (
    <aside className="lg:col-span-1">
      <Card className="sticky top-24">
        <CardContent className="p-6">
          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {canCreateEvents && (
                <Button 
                  onClick={onCreateEvent}
                  className="w-full bg-primary text-white hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <CalendarCheck className="w-4 h-4 mr-2" />
                Book Resources
              </Button>
            </div>
          </div>

          {/* Role-specific Menu */}
          {canManageClub && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">Club Management</h3>
              <nav className="space-y-2">
                <a href="#events-pending" className="flex items-center space-x-3 px-3 py-2 text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Clock className="w-4 h-4 text-warning" />
                  <span>Pending Approvals</span>
                  <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning">2</Badge>
                </a>
                <a href="#events-approved" className="flex items-center space-x-3 px-3 py-2 text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Approved Events</span>
                </a>
                <a href="#club-members" className="flex items-center space-x-3 px-3 py-2 text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Club Members</span>
                </a>
                <a href="#analytics" className="flex items-center space-x-3 px-3 py-2 text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </a>
              </nav>
            </div>
          )}

          {/* Upcoming Events Summary */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-neutral-800 dark:text-white">Tech Talk Series</p>
                <p className="text-xs text-neutral-600 dark:text-gray-300">Tomorrow, 2:00 PM</p>
                <p className="text-xs text-success">85 RSVPs</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-neutral-800 dark:text-white">Club Fair</p>
                <p className="text-xs text-neutral-600 dark:text-gray-300">Friday, 10:00 AM</p>
                <p className="text-xs text-warning">Pending approval</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
