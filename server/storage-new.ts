import { db } from "./db";
import { eq, and, or, like, desc, asc, gte, lte, inArray, sql } from "drizzle-orm";
import {
  users,
  clubs,
  events,
  eventApprovals,
  eventRsvps,
  resources,
  resourceBookings,
  socialPosts,
  socialComments,
  socialLikes,
  eventFeedback,
  eventPhotos,
  clubMemberships,
  eventPolls,
  pollResponses,
  venues,
  venueSchedules,
  equipment,
  equipmentSchedules,
  equipmentBookings,
  eventAnalytics,
  eventRegistrationForms,
  type User,
  type InsertUser,
  type Club,
  type InsertClub,
  type Event,
  type InsertEvent,
  type EventApproval,
  type InsertEventApproval,
  type EventRsvp,
  type InsertEventRsvp,
  type Resource,
  type InsertResource,
  type ResourceBooking,
  type InsertResourceBooking,
  type SocialPost,
  type InsertSocialPost,
  type SocialComment,
  type InsertSocialComment,
  type EventFeedback,
  type InsertEventFeedback,
  type EventPhoto,
  type InsertEventPhoto,
  type ClubMembership,
  type InsertClubMembership,
  type EventPoll,
  type InsertEventPoll,
  type PollResponse,
  type InsertPollResponse,
  type Venue,
  type InsertVenue,
  type VenueSchedule,
  type InsertVenueSchedule,
  type Equipment,
  type InsertEquipment,
  type EquipmentSchedule,
  type InsertEquipmentSchedule,
  type EquipmentBooking,
  type InsertEquipmentBooking,
  type EventAnalytics,
  type InsertEventAnalytics,
  type EventRegistrationForm,
  type InsertEventRegistrationForm,
} from "../shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Club management
  getClubs(): Promise<Club[]>;
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: number, updates: Partial<InsertClub>): Promise<Club | undefined>;

  // Event management with proper role-based access
  getEvents(filters?: { 
    status?: string; 
    clubId?: number; 
    organizerId?: number;
    userRole?: string;
    userId?: number;
  }): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Event approval workflow
  getEventApprovals(eventId: number): Promise<EventApproval[]>;
  createEventApproval(approval: InsertEventApproval): Promise<EventApproval>;
  updateEventApproval(id: number, updates: Partial<InsertEventApproval>): Promise<EventApproval | undefined>;
  
  // Admin-specific approval methods
  getPendingApprovalsForAdmin(): Promise<EventApproval[]>;
  approveEventAsAdmin(eventId: number, adminId: number, comments?: string): Promise<boolean>;
  rejectEventAsAdmin(eventId: number, adminId: number, comments: string): Promise<boolean>;

  // Teacher/HOD approval methods
  getPendingApprovalsForTeacher(teacherId: number): Promise<EventApproval[]>;
  approveEventAsTeacher(eventId: number, teacherId: number, comments?: string): Promise<boolean>;
  rejectEventAsTeacher(eventId: number, teacherId: number, comments: string): Promise<boolean>;

  // RSVP management with proper audience access
  getEventRsvps(eventId: number): Promise<EventRsvp[]>;
  getUserRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(id: number, updates: Partial<InsertEventRsvp>): Promise<EventRsvp | undefined>;
  generateRsvpNumber(): string;
  verifyRsvpNumber(rsvpNumber: string, eventId: number): Promise<EventRsvp | undefined>;

  // Venue management with scheduling
  getVenues(type?: string): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, updates: Partial<InsertVenue>): Promise<Venue | undefined>;
  getVenueSchedules(venueId: number): Promise<VenueSchedule[]>;
  createVenueSchedule(schedule: InsertVenueSchedule): Promise<VenueSchedule>;
  updateVenueSchedule(id: number, updates: Partial<InsertVenueSchedule>): Promise<VenueSchedule | undefined>;
  checkVenueAvailability(venueId: number, startTime: Date, endTime: Date): Promise<boolean>;

  // Equipment management with scheduling
  getEquipment(type?: string): Promise<Equipment[]>;
  getEquipmentItem(id: number): Promise<Equipment | undefined>;
  createEquipment(equipmentData: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  getEquipmentSchedules(equipmentId: number): Promise<EquipmentSchedule[]>;
  createEquipmentSchedule(schedule: InsertEquipmentSchedule): Promise<EquipmentSchedule>;
  updateEquipmentSchedule(id: number, updates: Partial<InsertEquipmentSchedule>): Promise<EquipmentSchedule | undefined>;
  checkEquipmentAvailability(equipmentId: number, quantity: number, startTime: Date, endTime: Date): Promise<boolean>;

  // Equipment booking
  getEquipmentBookings(equipmentId: number, startDate?: Date, endDate?: Date): Promise<EquipmentBooking[]>;
  createEquipmentBooking(booking: InsertEquipmentBooking): Promise<EquipmentBooking>;
  updateEquipmentBooking(id: number, updates: Partial<InsertEquipmentBooking>): Promise<EquipmentBooking | undefined>;

  // Resource management (legacy - to be phased out)
  getResources(type?: string): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  getResourceBookings(resourceId: number, startDate?: Date, endDate?: Date): Promise<ResourceBooking[]>;
  createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking>;
  updateResourceBooking(id: number, updates: Partial<InsertResourceBooking>): Promise<ResourceBooking | undefined>;

  // Social posts (only for audience/general feed)
  getSocialPosts(eventId?: number): Promise<SocialPost[]>;
  getSocialPost(id: number): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: number): Promise<boolean>;

  // Social interactions
  getPostComments(postId: number): Promise<SocialComment[]>;
  createSocialComment(comment: InsertSocialComment): Promise<SocialComment>;
  getPostLike(postId: number, userId: number): Promise<boolean>;
  togglePostLike(postId: number, userId: number): Promise<boolean>;

  // Event feedback
  getEventFeedback(eventId: number): Promise<EventFeedback[]>;
  createEventFeedback(feedback: InsertEventFeedback): Promise<EventFeedback>;

  // Event photos
  getEventPhotos(eventId: number): Promise<EventPhoto[]>;
  createEventPhoto(photo: InsertEventPhoto): Promise<EventPhoto>;
  updateEventPhoto(id: number, updates: Partial<InsertEventPhoto>): Promise<EventPhoto | undefined>;

  // Club memberships
  getClubMemberships(clubId: number): Promise<ClubMembership[]>;
  getUserMemberships(userId: number): Promise<ClubMembership[]>;
  createClubMembership(membership: InsertClubMembership): Promise<ClubMembership>;
  updateClubMembership(id: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership | undefined>;

  // Event polls
  getEventPolls(eventId: number): Promise<EventPoll[]>;
  createEventPoll(poll: InsertEventPoll): Promise<EventPoll>;
  updateEventPoll(id: number, updates: Partial<InsertEventPoll>): Promise<EventPoll | undefined>;

  // Poll responses
  getPollResponses(pollId: number): Promise<PollResponse[]>;
  getUserPollResponse(pollId: number, userId: number): Promise<PollResponse | undefined>;
  createPollResponse(response: InsertPollResponse): Promise<PollResponse>;

  // Event registration forms
  getEventRegistrationForms(eventId: number): Promise<EventRegistrationForm[]>;
  createEventRegistrationForm(form: InsertEventRegistrationForm): Promise<EventRegistrationForm>;

  // Event analytics
  getEventAnalytics(eventId: number): Promise<EventAnalytics | undefined>;
  createEventAnalytics(analytics: InsertEventAnalytics): Promise<EventAnalytics>;
  updateEventAnalytics(id: number, updates: Partial<InsertEventAnalytics>): Promise<EventAnalytics | undefined>;

  // Role-based access helpers
  canUserAccessResource(userId: number, resourceType: 'venues' | 'equipment' | 'approvals'): Promise<boolean>;
  getUserDashboardData(userId: number): Promise<any>;
}

export class ComprehensiveStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Club management
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs).where(eq(clubs.isActive, true));
  }

  async getClub(id: number): Promise<Club | undefined> {
    const result = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
    return result[0];
  }

  async createClub(club: InsertClub): Promise<Club> {
    const result = await db.insert(clubs).values(club).returning();
    return result[0];
  }

  async updateClub(id: number, updates: Partial<InsertClub>): Promise<Club | undefined> {
    const result = await db.update(clubs).set(updates).where(eq(clubs.id, id)).returning();
    return result[0];
  }

  // Event management with role-based filtering
  async getEvents(filters?: { 
    status?: string; 
    clubId?: number; 
    organizerId?: number;
    userRole?: string;
    userId?: number;
  }): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(events.status, filters.status));
    }
    
    if (filters?.clubId) {
      conditions.push(eq(events.clubId, filters.clubId));
    }
    
    if (filters?.organizerId) {
      conditions.push(eq(events.organizerId, filters.organizerId));
    }

    // Role-based filtering
    if (filters?.userRole === 'audience' || filters?.userRole === 'club_member') {
      // Students only see published events
      conditions.push(eq(events.status, 'published'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(events.createdAt));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event approval workflow
  async getEventApprovals(eventId: number): Promise<EventApproval[]> {
    return await db.select().from(eventApprovals).where(eq(eventApprovals.eventId, eventId));
  }

  async createEventApproval(approval: InsertEventApproval): Promise<EventApproval> {
    const result = await db.insert(eventApprovals).values(approval).returning();
    return result[0];
  }

  async updateEventApproval(id: number, updates: Partial<InsertEventApproval>): Promise<EventApproval | undefined> {
    const result = await db.update(eventApprovals).set(updates).where(eq(eventApprovals.id, id)).returning();
    return result[0];
  }

  // Admin-specific approval methods
  async getPendingApprovalsForAdmin(): Promise<EventApproval[]> {
    return await db.select().from(eventApprovals)
      .where(and(
        eq(eventApprovals.status, 'pending'),
        or(
          eq(eventApprovals.approverRole, 'admin'),
          eq(eventApprovals.approverRole, 'registrar'),
          eq(eventApprovals.approverRole, 'financial_head')
        )
      ));
  }

  async approveEventAsAdmin(eventId: number, adminId: number, comments?: string): Promise<boolean> {
    const result = await db.update(eventApprovals)
      .set({ 
        status: 'approved', 
        comments: comments || 'Approved by admin' 
      })
      .where(and(
        eq(eventApprovals.eventId, eventId),
        eq(eventApprovals.approverId, adminId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async rejectEventAsAdmin(eventId: number, adminId: number, comments: string): Promise<boolean> {
    const result = await db.update(eventApprovals)
      .set({ 
        status: 'rejected', 
        comments 
      })
      .where(and(
        eq(eventApprovals.eventId, eventId),
        eq(eventApprovals.approverId, adminId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Teacher/HOD approval methods
  async getPendingApprovalsForTeacher(teacherId: number): Promise<EventApproval[]> {
    return await db.select().from(eventApprovals)
      .where(and(
        eq(eventApprovals.status, 'pending'),
        eq(eventApprovals.approverId, teacherId),
        or(
          eq(eventApprovals.approverRole, 'teacher'),
          eq(eventApprovals.approverRole, 'hod')
        )
      ));
  }

  async approveEventAsTeacher(eventId: number, teacherId: number, comments?: string): Promise<boolean> {
    const result = await db.update(eventApprovals)
      .set({ 
        status: 'approved', 
        comments: comments || 'Approved by teacher' 
      })
      .where(and(
        eq(eventApprovals.eventId, eventId),
        eq(eventApprovals.approverId, teacherId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async rejectEventAsTeacher(eventId: number, teacherId: number, comments: string): Promise<boolean> {
    const result = await db.update(eventApprovals)
      .set({ 
        status: 'rejected', 
        comments 
      })
      .where(and(
        eq(eventApprovals.eventId, eventId),
        eq(eventApprovals.approverId, teacherId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // RSVP management
  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getUserRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    const result = await db.select().from(eventRsvps)
      .where(and(
        eq(eventRsvps.eventId, eventId),
        eq(eventRsvps.userId, userId)
      ))
      .limit(1);
    return result[0];
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const rsvpNumber = this.generateRsvpNumber();
    const result = await db.insert(eventRsvps).values({
      ...rsvp,
      rsvpNumber
    }).returning();
    return result[0];
  }

  async updateEventRsvp(id: number, updates: Partial<InsertEventRsvp>): Promise<EventRsvp | undefined> {
    const result = await db.update(eventRsvps).set(updates).where(eq(eventRsvps.id, id)).returning();
    return result[0];
  }

  generateRsvpNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `RSVP-${timestamp}-${random}`.toUpperCase();
  }

  async verifyRsvpNumber(rsvpNumber: string, eventId: number): Promise<EventRsvp | undefined> {
    const result = await db.select().from(eventRsvps)
      .where(and(
        eq(eventRsvps.rsvpNumber, rsvpNumber),
        eq(eventRsvps.eventId, eventId)
      ))
      .limit(1);
    return result[0];
  }

  // Venue management with scheduling
  async getVenues(type?: string): Promise<Venue[]> {
    let query = db.select().from(venues).where(eq(venues.isAvailable, true));
    
    if (type) {
      query = query.where(and(eq(venues.isAvailable, true), eq(venues.type, type)));
    }
    
    return await query;
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const result = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
    return result[0];
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const result = await db.insert(venues).values(venue).returning();
    return result[0];
  }

  async updateVenue(id: number, updates: Partial<InsertVenue>): Promise<Venue | undefined> {
    const result = await db.update(venues).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(venues.id, id)).returning();
    return result[0];
  }

  async getVenueSchedules(venueId: number): Promise<VenueSchedule[]> {
    return await db.select().from(venueSchedules).where(eq(venueSchedules.venueId, venueId));
  }

  async createVenueSchedule(schedule: InsertVenueSchedule): Promise<VenueSchedule> {
    const result = await db.insert(venueSchedules).values(schedule).returning();
    return result[0];
  }

  async updateVenueSchedule(id: number, updates: Partial<InsertVenueSchedule>): Promise<VenueSchedule | undefined> {
    const result = await db.update(venueSchedules).set(updates).where(eq(venueSchedules.id, id)).returning();
    return result[0];
  }

  async checkVenueAvailability(venueId: number, startTime: Date, endTime: Date): Promise<boolean> {
    // Check for conflicting bookings
    const conflictingBookings = await db.select().from(resourceBookings)
      .where(and(
        eq(resourceBookings.resourceId, venueId),
        eq(resourceBookings.status, 'approved'),
        or(
          and(
            gte(resourceBookings.startTime, startTime),
            lte(resourceBookings.startTime, endTime)
          ),
          and(
            gte(resourceBookings.endTime, startTime),
            lte(resourceBookings.endTime, endTime)
          ),
          and(
            lte(resourceBookings.startTime, startTime),
            gte(resourceBookings.endTime, endTime)
          )
        )
      ));

    return conflictingBookings.length === 0;
  }

  // Equipment management with scheduling
  async getEquipment(type?: string): Promise<Equipment[]> {
    let query = db.select().from(equipment);
    
    if (type) {
      query = query.where(eq(equipment.type, type));
    }
    
    return await query;
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return result[0];
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values(equipmentData).returning();
    return result[0];
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const result = await db.update(equipment).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(equipment.id, id)).returning();
    return result[0];
  }

  async getEquipmentSchedules(equipmentId: number): Promise<EquipmentSchedule[]> {
    return await db.select().from(equipmentSchedules).where(eq(equipmentSchedules.equipmentId, equipmentId));
  }

  async createEquipmentSchedule(schedule: InsertEquipmentSchedule): Promise<EquipmentSchedule> {
    const result = await db.insert(equipmentSchedules).values(schedule).returning();
    return result[0];
  }

  async updateEquipmentSchedule(id: number, updates: Partial<InsertEquipmentSchedule>): Promise<EquipmentSchedule | undefined> {
    const result = await db.update(equipmentSchedules).set(updates).where(eq(equipmentSchedules.id, id)).returning();
    return result[0];
  }

  async checkEquipmentAvailability(equipmentId: number, quantity: number, startTime: Date, endTime: Date): Promise<boolean> {
    const equipmentItem = await this.getEquipmentItem(equipmentId);
    if (!equipmentItem || equipmentItem.availableQuantity < quantity) {
      return false;
    }

    // Check for conflicting bookings
    const conflictingBookings = await db.select().from(equipmentBookings)
      .where(and(
        eq(equipmentBookings.equipmentId, equipmentId),
        eq(equipmentBookings.status, 'approved'),
        or(
          and(
            gte(equipmentBookings.startTime, startTime),
            lte(equipmentBookings.startTime, endTime)
          ),
          and(
            gte(equipmentBookings.endTime, startTime),
            lte(equipmentBookings.endTime, endTime)
          ),
          and(
            lte(equipmentBookings.startTime, startTime),
            gte(equipmentBookings.endTime, endTime)
          )
        )
      ));

    const totalBookedQuantity = conflictingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    return (equipmentItem.availableQuantity - totalBookedQuantity) >= quantity;
  }

  // Equipment booking
  async getEquipmentBookings(equipmentId: number, startDate?: Date, endDate?: Date): Promise<EquipmentBooking[]> {
    let query = db.select().from(equipmentBookings).where(eq(equipmentBookings.equipmentId, equipmentId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(equipmentBookings.equipmentId, equipmentId),
        gte(equipmentBookings.startTime, startDate),
        lte(equipmentBookings.endTime, endDate)
      ));
    }
    
    return await query;
  }

  async createEquipmentBooking(booking: InsertEquipmentBooking): Promise<EquipmentBooking> {
    const result = await db.insert(equipmentBookings).values(booking).returning();
    return result[0];
  }

  async updateEquipmentBooking(id: number, updates: Partial<InsertEquipmentBooking>): Promise<EquipmentBooking | undefined> {
    const result = await db.update(equipmentBookings).set(updates).where(eq(equipmentBookings.id, id)).returning();
    return result[0];
  }

  // Resource management (legacy)
  async getResources(type?: string): Promise<Resource[]> {
    let query = db.select().from(resources).where(eq(resources.isAvailable, true));
    
    if (type) {
      query = query.where(and(eq(resources.isAvailable, true), eq(resources.type, type)));
    }
    
    return await query;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return result[0];
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const result = await db.insert(resources).values(resource).returning();
    return result[0];
  }

  async getResourceBookings(resourceId: number, startDate?: Date, endDate?: Date): Promise<ResourceBooking[]> {
    let query = db.select().from(resourceBookings).where(eq(resourceBookings.resourceId, resourceId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(resourceBookings.resourceId, resourceId),
        gte(resourceBookings.startTime, startDate),
        lte(resourceBookings.endTime, endDate)
      ));
    }
    
    return await query;
  }

  async createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking> {
    const result = await db.insert(resourceBookings).values(booking).returning();
    return result[0];
  }

  async updateResourceBooking(id: number, updates: Partial<InsertResourceBooking>): Promise<ResourceBooking | undefined> {
    const result = await db.update(resourceBookings).set(updates).where(eq(resourceBookings.id, id)).returning();
    return result[0];
  }

  // Social posts (audience feed only)
  async getSocialPosts(eventId?: number): Promise<SocialPost[]> {
    let query = db.select().from(socialPosts);
    
    if (eventId) {
      query = query.where(eq(socialPosts.eventId, eventId));
    }
    
    return await query.orderBy(desc(socialPosts.createdAt));
  }

  async getSocialPost(id: number): Promise<SocialPost | undefined> {
    const result = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    return result[0];
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const result = await db.insert(socialPosts).values(post).returning();
    return result[0];
  }

  async updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const result = await db.update(socialPosts).set(updates).where(eq(socialPosts.id, id)).returning();
    return result[0];
  }

  async deleteSocialPost(id: number): Promise<boolean> {
    const result = await db.delete(socialPosts).where(eq(socialPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Social interactions
  async getPostComments(postId: number): Promise<SocialComment[]> {
    return await db.select().from(socialComments).where(eq(socialComments.postId, postId)).orderBy(asc(socialComments.createdAt));
  }

  async createSocialComment(comment: InsertSocialComment): Promise<SocialComment> {
    const result = await db.insert(socialComments).values(comment).returning();
    return result[0];
  }

  async getPostLike(postId: number, userId: number): Promise<boolean> {
    const result = await db.select().from(socialLikes)
      .where(and(
        eq(socialLikes.postId, postId),
        eq(socialLikes.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async togglePostLike(postId: number, userId: number): Promise<boolean> {
    const existingLike = await this.getPostLike(postId, userId);
    
    if (existingLike) {
      await db.delete(socialLikes)
        .where(and(
          eq(socialLikes.postId, postId),
          eq(socialLikes.userId, userId)
        ));
      return false;
    } else {
      await db.insert(socialLikes).values({ postId, userId });
      return true;
    }
  }

  // Event feedback
  async getEventFeedback(eventId: number): Promise<EventFeedback[]> {
    return await db.select().from(eventFeedback).where(eq(eventFeedback.eventId, eventId));
  }

  async createEventFeedback(feedback: InsertEventFeedback): Promise<EventFeedback> {
    const result = await db.insert(eventFeedback).values(feedback).returning();
    return result[0];
  }

  // Event photos
  async getEventPhotos(eventId: number): Promise<EventPhoto[]> {
    return await db.select().from(eventPhotos).where(eq(eventPhotos.eventId, eventId));
  }

  async createEventPhoto(photo: InsertEventPhoto): Promise<EventPhoto> {
    const result = await db.insert(eventPhotos).values(photo).returning();
    return result[0];
  }

  async updateEventPhoto(id: number, updates: Partial<InsertEventPhoto>): Promise<EventPhoto | undefined> {
    const result = await db.update(eventPhotos).set(updates).where(eq(eventPhotos.id, id)).returning();
    return result[0];
  }

  // Club memberships
  async getClubMemberships(clubId: number): Promise<ClubMembership[]> {
    return await db.select().from(clubMemberships).where(eq(clubMemberships.clubId, clubId));
  }

  async getUserMemberships(userId: number): Promise<ClubMembership[]> {
    return await db.select().from(clubMemberships).where(eq(clubMemberships.userId, userId));
  }

  async createClubMembership(membership: InsertClubMembership): Promise<ClubMembership> {
    const result = await db.insert(clubMemberships).values(membership).returning();
    return result[0];
  }

  async updateClubMembership(id: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership | undefined> {
    const result = await db.update(clubMemberships).set(updates).where(eq(clubMemberships.id, id)).returning();
    return result[0];
  }

  // Event polls
  async getEventPolls(eventId: number): Promise<EventPoll[]> {
    return await db.select().from(eventPolls).where(eq(eventPolls.eventId, eventId));
  }

  async createEventPoll(poll: InsertEventPoll): Promise<EventPoll> {
    const result = await db.insert(eventPolls).values(poll).returning();
    return result[0];
  }

  async updateEventPoll(id: number, updates: Partial<InsertEventPoll>): Promise<EventPoll | undefined> {
    const result = await db.update(eventPolls).set(updates).where(eq(eventPolls.id, id)).returning();
    return result[0];
  }

  // Poll responses
  async getPollResponses(pollId: number): Promise<PollResponse[]> {
    return await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));
  }

  async getUserPollResponse(pollId: number, userId: number): Promise<PollResponse | undefined> {
    const result = await db.select().from(pollResponses)
      .where(and(
        eq(pollResponses.pollId, pollId),
        eq(pollResponses.userId, userId)
      ))
      .limit(1);
    return result[0];
  }

  async createPollResponse(response: InsertPollResponse): Promise<PollResponse> {
    const result = await db.insert(pollResponses).values(response).returning();
    return result[0];
  }

  // Event registration forms
  async getEventRegistrationForms(eventId: number): Promise<EventRegistrationForm[]> {
    return await db.select().from(eventRegistrationForms).where(eq(eventRegistrationForms.eventId, eventId));
  }

  async createEventRegistrationForm(form: InsertEventRegistrationForm): Promise<EventRegistrationForm> {
    const result = await db.insert(eventRegistrationForms).values(form).returning();
    return result[0];
  }

  // Event analytics
  async getEventAnalytics(eventId: number): Promise<EventAnalytics | undefined> {
    const result = await db.select().from(eventAnalytics).where(eq(eventAnalytics.eventId, eventId)).limit(1);
    return result[0];
  }

  async createEventAnalytics(analytics: InsertEventAnalytics): Promise<EventAnalytics> {
    const result = await db.insert(eventAnalytics).values(analytics).returning();
    return result[0];
  }

  async updateEventAnalytics(id: number, updates: Partial<InsertEventAnalytics>): Promise<EventAnalytics | undefined> {
    const result = await db.update(eventAnalytics).set(updates).where(eq(eventAnalytics.id, id)).returning();
    return result[0];
  }

  // Role-based access helpers
  async canUserAccessResource(userId: number, resourceType: 'venues' | 'equipment' | 'approvals'): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const allowedRoles = ['admin', 'technical_staff', 'registrar', 'financial_head'];
    
    if (resourceType === 'approvals') {
      allowedRoles.push('teacher', 'hod');
    }

    return allowedRoles.includes(user.role);
  }

  async getUserDashboardData(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const baseData = {
      user,
      role: user.role
    };

    switch (user.role) {
      case 'admin':
      case 'registrar':
      case 'financial_head':
        return {
          ...baseData,
          pendingApprovals: await this.getPendingApprovalsForAdmin(),
          allEvents: await this.getEvents(),
          venues: await this.getVenues(),
          equipment: await this.getEquipment()
        };

      case 'technical_staff':
        return {
          ...baseData,
          venues: await this.getVenues(),
          equipment: await this.getEquipment(),
          upcomingEvents: await this.getEvents({ status: 'approved' })
        };

      case 'teacher':
      case 'hod':
        return {
          ...baseData,
          pendingApprovals: await this.getPendingApprovalsForTeacher(userId),
          myEvents: await this.getEvents({ organizerId: userId }),
          venues: await this.getVenues(),
          equipment: await this.getEquipment()
        };

      case 'club_head':
        return {
          ...baseData,
          myEvents: await this.getEvents({ organizerId: userId }),
          clubMemberships: await this.getUserMemberships(userId)
        };

      case 'audience':
      case 'club_member':
      default:
        return {
          ...baseData,
          socialPosts: await this.getSocialPosts(),
          myRsvps: await db.select().from(eventRsvps).where(eq(eventRsvps.userId, userId))
        };
    }
  }
}