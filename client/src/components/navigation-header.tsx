import { Link } from "wouter";
import { Bell, GraduationCap, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavigationHeader() {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'club_head':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'club_member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'registrar':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'financial_head':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-neutral-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/dashboard">
            <div className="flex items-center space-x-4 cursor-pointer">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-800 dark:text-white">CampusConnect</h1>
                  <p className="text-xs text-neutral-600 dark:text-gray-300">Event Hub</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
          {['admin', 'teacher', 'hod', 'technical_staff', 'club_head', 'club_member'].includes(user?.role || '') && (
            <Link href="/dashboard">
              <a className="text-primary font-medium border-b-2 border-primary pb-1">Dashboard</a>
            </Link>
          )}

          <Link href="/events">
            <a className="text-neutral-600 dark:text-gray-300 hover:text-primary transition-colors">Events</a>
          </Link>

          {['admin', 'teacher', 'hod', 'technical_staff', 'club_head', 'registrar'].includes(user?.role || '') && (
            <Link href="/resources">
              <a className="text-neutral-600 dark:text-gray-300 hover:text-primary transition-colors">Resources</a>
            </Link>
          )}

          <Link href="/social">
            <a className="text-neutral-600 dark:text-gray-300 hover:text-primary transition-colors">Social</a>
          </Link>
        </div>
          </nav>

          {/* User Profile and Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-800 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <Badge className={`text-xs ${getRoleBadgeColor(user?.role || 'audience')}`}>
                      {formatRole(user?.role || 'audience')}
                    </Badge>
                  </div>
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-neutral-600 dark:text-gray-300" />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}