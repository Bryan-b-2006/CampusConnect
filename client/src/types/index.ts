import type { User, Event, Post, Club, Resource, Notification, EventRsvp, EventFeedback, Comment } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  clubId?: number;
}

export interface EventWithDetails extends Event {
  organizer?: User;
  club?: Club;
  rsvpCount?: number;
  isRsvped?: boolean;
  approvalStatus?: string;
}

export interface PostWithDetails extends Post {
  author?: User;
  event?: Event;
  isLiked?: boolean;
  comments?: Comment[];
}

export interface NotificationWithEvent extends Notification {
  event?: Event;
}

export interface ResourceWithBookings extends Resource {
  isAvailable?: boolean;
  nextAvailable?: string;
  currentBooking?: string;
}

export interface DashboardStats {
  activeEvents: number;
  totalRsvps: number;
  pendingApprovals: number;
  activeClubs: number;
}

export interface ApiError {
  message: string;
  errors?: any[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
