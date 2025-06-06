
<old_str>import type { AuthUser } from "../types";</old_str>
<new_str>export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  department?: string;
  division?: string;
  year?: number;
  clubId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'student'
  | 'club_head'
  | 'teacher'
  | 'hod'
  | 'admin'
  | 'technical_staff'
  | 'registrar'
  | 'financial_head';

export interface Event {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  maxAttendees?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  organizerId: number;
  clubId?: number;
  requiresApproval: boolean;
  registrationOpen: boolean;
  registrationDeadline?: Date;
  eventType: 'workshop' | 'seminar' | 'competition' | 'cultural' | 'sports' | 'technical' | 'other';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: number;
  name: string;
  type: 'venue' | 'equipment';
  description?: string;
  capacity?: number;
  location?: string;
  isAvailable: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RSVP {
  id: number;
  eventId: number;
  userId: number;
  status: 'attending' | 'not_attending' | 'maybe';
  registrationType: 'audience' | 'participant' | 'volunteer';
  rsvpNumber: string;
  formData?: any;
  createdAt: Date;
  updatedAt: Date;
}</new_str>
