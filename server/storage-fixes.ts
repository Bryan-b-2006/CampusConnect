import { eq, and, like, gte, lte, or } from "drizzle-orm";
import { db } from "./db";
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
  equipment,
  equipmentBookings,
  eventRegistrationForms,
  eventAnalytics,
} from "@shared/schema";
import type {
  User,
  InsertUser,
  Club,
  InsertClub,
  Event,
  InsertEvent,
  EventApproval,
  InsertEventApproval,
  EventRsvp,
  InsertEventRsvp,
  Resource,
  InsertResource,
  ResourceBooking,
  InsertResourceBooking,
  SocialPost,
  InsertSocialPost,
  SocialComment,
  InsertSocialComment,
  EventFeedback,
  InsertEventFeedback,
  EventPhoto,
  InsertEventPhoto,
  ClubMembership,
  InsertClubMembership,
  EventPoll,
  InsertEventPoll,
  PollResponse,
  InsertPollResponse,
  Venue,
  InsertVenue,
  Equipment,
  InsertEquipment,
  EquipmentBooking,
  InsertEquipmentBooking,
  EventRegistrationForm,
  InsertEventRegistrationForm,
  EventAnalytics,
  InsertEventAnalytics,
} from "@shared/schema";
import { IStorage } from "./storage";

export class FixedDatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Club management
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs);
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async createClub(club: InsertClub): Promise<Club> {
    const [newClub] = await db.insert(clubs).values(club).returning();
    return newClub;
  }

  async updateClub(id: number, updates: Partial<InsertClub>): Promise<Club | undefined> {
    const [club] = await db.update(clubs).set(updates).where(eq(clubs.id, id)).returning();
    return club || undefined;
  }

  // Event management with proper venue/time conflict checking
  async getEvents(filters?: { status?: string; clubId?: number; organizerId?: number }): Promise<Event[]> {
    if (!filters) {
      return await db.select().from(events);
    }
    
    const conditions = [];
    if (filters.status) conditions.push(eq(events.status, filters.status));
    if (filters.clubId) conditions.push(eq(events.clubId, filters.clubId));
    if (filters.organizerId) conditions.push(eq(events.organizerId, filters.organizerId));
    
    if (conditions.length === 0) {
      return await db.select().from(events);
    }
    
    return await db.select().from(events).where(and(...conditions));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Check for venue conflicts before creating event
    if (event.location) {
      const conflictingEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.location, event.location),
            eq(events.status, "approved"),
            or(
              and(
                gte(events.startDate, event.startDate),
                lte(events.startDate, event.endDate)
              ),
              and(
                gte(events.endDate, event.startDate),
                lte(events.endDate, event.endDate)
              ),
              and(
                lte(events.startDate, event.startDate),
                gte(events.endDate, event.endDate)
              )
            )
          )
        );

      if (conflictingEvents.length > 0) {
        throw new Error(`Venue conflict: ${event.location} is already booked during this time`);
      }
    }

    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event approvals with multi-level workflow
  async getEventApprovals(eventId: number): Promise<EventApproval[]> {
    return await db.select().from(eventApprovals).where(eq(eventApprovals.eventId, eventId));
  }

  async createEventApproval(approval: InsertEventApproval): Promise<EventApproval> {
    const [newApproval] = await db.insert(eventApprovals).values(approval).returning();
    
    // Check if all required approvals are complete
    const allApprovals = await this.getEventApprovals(approval.eventId);
    const approvedCount = allApprovals.filter(a => a.status === 'approved').length;
    const rejectedCount = allApprovals.filter(a => a.status === 'rejected').length;
    
    // If any approval is rejected, reject the event
    if (rejectedCount > 0) {
      await this.updateEvent(approval.eventId, { status: 'rejected' });
    } 
    // If all required approvals are approved (at least 2: teacher and registrar)
    else if (approvedCount >= 2) {
      await this.updateEvent(approval.eventId, { status: 'approved' });
    }
    
    return newApproval;
  }

  async updateEventApproval(id: number, updates: Partial<InsertEventApproval>): Promise<EventApproval | undefined> {
    const [approval] = await db.update(eventApprovals).set(updates).where(eq(eventApprovals.id, id)).returning();
    return approval || undefined;
  }

  // Enhanced RSVP system with proper number generation
  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getUserRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return rsvp || undefined;
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const rsvpNumber = this.generateRsvpNumber();
    const [newRsvp] = await db.insert(eventRsvps).values({
      ...rsvp,
      rsvpNumber
    }).returning();
    return newRsvp;
  }

  async updateEventRsvp(id: number, updates: Partial<InsertEventRsvp>): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.update(eventRsvps).set(updates).where(eq(eventRsvps.id, id)).returning();
    return rsvp || undefined;
  }

  // Resource management
  async getResources(type?: string): Promise<Resource[]> {
    if (type) {
      return await db.select().from(resources).where(eq(resources.type, type));
    }
    return await db.select().from(resources);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  // Resource bookings with conflict checking
  async getResourceBookings(resourceId: number, startDate?: Date, endDate?: Date): Promise<ResourceBooking[]> {
    let query = db.select().from(resourceBookings).where(eq(resourceBookings.resourceId, resourceId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(resourceBookings.resourceId, resourceId),
          or(
            and(gte(resourceBookings.startTime, startDate), lte(resourceBookings.startTime, endDate)),
            and(gte(resourceBookings.endTime, startDate), lte(resourceBookings.endTime, endDate)),
            and(lte(resourceBookings.startTime, startDate), gte(resourceBookings.endTime, endDate))
          )
        )
      ) as any;
    }
    
    return await query;
  }

  async createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking> {
    // Check for booking conflicts
    const conflictingBookings = await this.getResourceBookings(
      booking.resourceId,
      booking.startTime,
      booking.endTime
    );
    
    if (conflictingBookings.length > 0) {
      throw new Error('Resource is already booked during this time');
    }
    
    const [newBooking] = await db.insert(resourceBookings).values(booking).returning();
    return newBooking;
  }

  async updateResourceBooking(id: number, updates: Partial<InsertResourceBooking>): Promise<ResourceBooking | undefined> {
    const [booking] = await db.update(resourceBookings).set(updates).where(eq(resourceBookings.id, id)).returning();
    return booking || undefined;
  }

  // Social posts
  async getSocialPosts(eventId?: number): Promise<SocialPost[]> {
    if (eventId) {
      return await db.select().from(socialPosts).where(eq(socialPosts.eventId, eventId));
    }
    return await db.select().from(socialPosts);
  }

  async getSocialPost(id: number): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post || undefined;
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [newPost] = await db.insert(socialPosts).values(post).returning();
    return newPost;
  }

  async updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const [post] = await db.update(socialPosts).set(updates).where(eq(socialPosts.id, id)).returning();
    return post || undefined;
  }

  async deleteSocialPost(id: number): Promise<boolean> {
    const result = await db.delete(socialPosts).where(eq(socialPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Social comments
  async getPostComments(postId: number): Promise<SocialComment[]> {
    return await db.select().from(socialComments).where(eq(socialComments.postId, postId));
  }

  async createSocialComment(comment: InsertSocialComment): Promise<SocialComment> {
    const [newComment] = await db.insert(socialComments).values(comment).returning();
    return newComment;
  }

  // Social likes
  async getPostLike(postId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(socialLikes)
      .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId)));
    return !!like;
  }

  async togglePostLike(postId: number, userId: number): Promise<boolean> {
    const existingLike = await this.getPostLike(postId, userId);
    
    if (existingLike) {
      await db
        .delete(socialLikes)
        .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId)));
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
    const [newFeedback] = await db.insert(eventFeedback).values(feedback).returning();
    return newFeedback;
  }

  // Event photos
  async getEventPhotos(eventId: number): Promise<EventPhoto[]> {
    return await db.select().from(eventPhotos).where(eq(eventPhotos.eventId, eventId));
  }

  async createEventPhoto(photo: InsertEventPhoto): Promise<EventPhoto> {
    const [newPhoto] = await db.insert(eventPhotos).values(photo).returning();
    return newPhoto;
  }

  async updateEventPhoto(id: number, updates: Partial<InsertEventPhoto>): Promise<EventPhoto | undefined> {
    const [photo] = await db.update(eventPhotos).set(updates).where(eq(eventPhotos.id, id)).returning();
    return photo || undefined;
  }

  // Club memberships
  async getClubMemberships(clubId: number): Promise<ClubMembership[]> {
    return await db.select().from(clubMemberships).where(eq(clubMemberships.clubId, clubId));
  }

  async getUserMemberships(userId: number): Promise<ClubMembership[]> {
    return await db.select().from(clubMemberships).where(eq(clubMemberships.userId, userId));
  }

  async createClubMembership(membership: InsertClubMembership): Promise<ClubMembership> {
    const [newMembership] = await db.insert(clubMemberships).values(membership).returning();
    return newMembership;
  }

  async updateClubMembership(id: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership | undefined> {
    const [membership] = await db.update(clubMemberships).set(updates).where(eq(clubMemberships.id, id)).returning();
    return membership || undefined;
  }

  // Event polls
  async getEventPolls(eventId: number): Promise<EventPoll[]> {
    return await db.select().from(eventPolls).where(eq(eventPolls.eventId, eventId));
  }

  async createEventPoll(poll: InsertEventPoll): Promise<EventPoll> {
    const [newPoll] = await db.insert(eventPolls).values(poll).returning();
    return newPoll;
  }

  async updateEventPoll(id: number, updates: Partial<InsertEventPoll>): Promise<EventPoll | undefined> {
    const [poll] = await db.update(eventPolls).set(updates).where(eq(eventPolls.id, id)).returning();
    return poll || undefined;
  }

  // Poll responses
  async getPollResponses(pollId: number): Promise<PollResponse[]> {
    return await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));
  }

  async getUserPollResponse(pollId: number, userId: number): Promise<PollResponse | undefined> {
    const [response] = await db
      .select()
      .from(pollResponses)
      .where(and(eq(pollResponses.pollId, pollId), eq(pollResponses.userId, userId)));
    return response || undefined;
  }

  async createPollResponse(response: InsertPollResponse): Promise<PollResponse> {
    const [newResponse] = await db.insert(pollResponses).values(response).returning();
    return newResponse;
  }

  // Venues
  async getVenues(type?: string): Promise<Venue[]> {
    if (type) {
      return await db.select().from(venues).where(eq(venues.type, type));
    }
    return await db.select().from(venues);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue || undefined;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: number, updates: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [venue] = await db.update(venues).set(updates).where(eq(venues.id, id)).returning();
    return venue || undefined;
  }

  // Equipment
  async getEquipment(type?: string): Promise<Equipment[]> {
    if (type) {
      return await db.select().from(equipment).where(eq(equipment.type, type));
    }
    return await db.select().from(equipment);
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item || undefined;
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipment).values(equipmentData).returning();
    return newEquipment;
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [item] = await db.update(equipment).set(updates).where(eq(equipment.id, id)).returning();
    return item || undefined;
  }

  // Equipment bookings
  async getEquipmentBookings(equipmentId: number, startDate?: Date, endDate?: Date): Promise<EquipmentBooking[]> {
    let query = db.select().from(equipmentBookings).where(eq(equipmentBookings.equipmentId, equipmentId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(equipmentBookings.equipmentId, equipmentId),
          or(
            and(gte(equipmentBookings.startTime, startDate), lte(equipmentBookings.startTime, endDate)),
            and(gte(equipmentBookings.endTime, startDate), lte(equipmentBookings.endTime, endDate)),
            and(lte(equipmentBookings.startTime, startDate), gte(equipmentBookings.endTime, endDate))
          )
        )
      ) as any;
    }
    
    return await query;
  }

  async createEquipmentBooking(booking: InsertEquipmentBooking): Promise<EquipmentBooking> {
    const [newBooking] = await db.insert(equipmentBookings).values(booking).returning();
    return newBooking;
  }

  async updateEquipmentBooking(id: number, updates: Partial<InsertEquipmentBooking>): Promise<EquipmentBooking | undefined> {
    const [booking] = await db.update(equipmentBookings).set(updates).where(eq(equipmentBookings.id, id)).returning();
    return booking || undefined;
  }

  // Event registration forms
  async getEventRegistrationForms(eventId: number): Promise<EventRegistrationForm[]> {
    return await db.select().from(eventRegistrationForms).where(eq(eventRegistrationForms.eventId, eventId));
  }

  async createEventRegistrationForm(form: InsertEventRegistrationForm): Promise<EventRegistrationForm> {
    const [newForm] = await db.insert(eventRegistrationForms).values(form).returning();
    return newForm;
  }

  // Event analytics
  async getEventAnalytics(eventId: number): Promise<EventAnalytics | undefined> {
    const [analytics] = await db.select().from(eventAnalytics).where(eq(eventAnalytics.eventId, eventId));
    return analytics || undefined;
  }

  async createEventAnalytics(analytics: InsertEventAnalytics): Promise<EventAnalytics> {
    const [newAnalytics] = await db.insert(eventAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async updateEventAnalytics(id: number, updates: Partial<InsertEventAnalytics>): Promise<EventAnalytics | undefined> {
    const [analytics] = await db.update(eventAnalytics).set(updates).where(eq(eventAnalytics.id, id)).returning();
    return analytics || undefined;
  }

  // Enhanced RSVP functions
  generateRsvpNumber(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `RSV-${timestamp}-${randomStr}`.toUpperCase();
  }

  async verifyRsvpNumber(rsvpNumber: string, eventId: number): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.rsvpNumber, rsvpNumber), eq(eventRsvps.eventId, eventId)));
    return rsvp || undefined;
  }
}