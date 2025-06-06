import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Calendar, Users, BarChart3, Settings, LogOut, Menu, 
  Home, UserCheck, Building, DollarSign, Shield, Award,
  BookOpen, Vote, Camera, QrCode, Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  badge?: string;
}

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Role Dashboard",
      href: "/role-dashboard",
      icon: BarChart3,
    },
    {
      name: "Admin Dashboard",
      href: "/admin-dashboard",
      icon: Shield,
      roles: ["admin", "technical_staff"]
    },
    {
      name: "Live Interaction",
      href: "/live-interaction",
      icon: Camera,
    },
    {
      name: "Events",
      href: "/events",
      icon: Calendar,
    },
    {
      name: "Enhanced Events",
      href: "/enhanced-events",
      icon: Vote,
      badge: "New"
    },
    {
      name: "Resources",
      href: "/resources",
      icon: Building,
    },
    {
      name: "Social Feed",
      href: "/social",
      icon: Users,
    },
    {
      name: "Venue Management",
      href: "/venues",
      icon: Building,
      roles: ["admin", "registrar"]
    },
    {
      name: "Equipment",
      href: "/equipment",
      icon: Settings,
      roles: ["admin", "registrar"]
    },
    {
      name: "Financial",
      href: "/financial",
      icon: DollarSign,
      roles: ["admin", "financial_head"]
    },
    {
      name: "User Management",
      href: "/users",
      icon: Shield,
      roles: ["admin"]
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["admin", "teacher", "registrar", "financial_head"]
    },
    {
      name: "RSVP Scanner",
      href: "/rsvp-scanner",
      icon: QrCode,
      roles: ["admin", "teacher", "registrar"]
    }
  ];

  const filteredNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const NavItems = ({ mobile = false }) => (
    <div className={`${mobile ? 'flex flex-col space-y-2' : 'hidden md:flex md:space-x-1'}`}>
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`${mobile ? 'w-full justify-start' : ''} relative`}
              onClick={() => mobile && setMobileMenuOpen(false)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.name}
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCheck className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        {user?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NotificationBell = () => (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
        3
      </span>
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl hidden sm:block">EventHub</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <NavItems />

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <UserMenu />
            
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="text-lg font-semibold">Navigation</div>
                  <NavItems mobile />
                  
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground mb-2">Quick Actions</div>
                    <div className="space-y-2">
                      <Link href="/enhanced-events">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                          <Vote className="h-4 w-4 mr-2" />
                          Create Event
                        </Button>
                      </Link>
                      <Link href="/rsvp-scanner">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Scan RSVP
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Role-based badge component
export function RoleBadge({ role }: { role: string }) {
  const roleColors = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    registrar: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    financial_head: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    club_head: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    club_member: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    audience: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  const roleIcons = {
    admin: Shield,
    teacher: BookOpen,
    registrar: UserCheck,
    financial_head: DollarSign,
    club_head: Award,
    club_member: Users,
    audience: Users,
  };

  const Icon = roleIcons[role as keyof typeof roleIcons] || Users;
  const colorClass = roleColors[role as keyof typeof roleColors] || roleColors.audience;

  return (
    <Badge className={`${colorClass} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {role.replace('_', ' ').toUpperCase()}
    </Badge>
  );
}

// Feature access helper
export function hasFeatureAccess(userRole: string, feature: string): boolean {
  const featureAccess = {
    'create_events': ['admin', 'teacher', 'club_head', 'club_member'],
    'approve_events': ['admin', 'teacher', 'registrar'],
    'manage_venues': ['admin', 'registrar'],
    'manage_equipment': ['admin', 'registrar'],
    'financial_approval': ['admin', 'financial_head'],
    'view_analytics': ['admin', 'teacher', 'registrar', 'financial_head'],
    'verify_rsvp': ['admin', 'teacher', 'registrar'],
    'create_polls': ['admin', 'teacher', 'club_head', 'club_member'],
    'upload_photos': ['admin', 'teacher', 'club_head', 'club_member', 'audience'],
    'social_posting': ['admin', 'teacher', 'club_head', 'club_member', 'audience'],
  };

  const allowedRoles = featureAccess[feature as keyof typeof featureAccess];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}