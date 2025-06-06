import { 
  users, clubs, events, eventApprovals, eventRsvps, resources, resourceBookings,
  socialPosts, socialComments, socialLikes, eventFeedback, eventPhotos,
  eventPolls, pollResponses, clubMemberships, eventRegistrationForms,
  venues, equipment, equipmentBookings, eventAnalytics,
  type User, type InsertUser, type Club, type InsertClub, type Event, type InsertEvent,
  type EventApproval, type InsertEventApproval, type EventRsvp, type InsertEventRsvp,
  type Resource, type InsertResource, type ResourceBooking, type InsertResourceBooking,
  type SocialPost, type InsertSocialPost, type SocialComment, type InsertSocialComment,
  type EventFeedback, type InsertEventFeedback, type EventPhoto, type InsertEventPhoto,
  type EventPoll, type InsertEventPoll, type PollResponse, type InsertPollResponse,
  type ClubMembership, type InsertClubMembership, type EventRegistrationForm, type InsertEventRegistrationForm,
  type Venue, type InsertVenue, type Equipment, type InsertEquipment,
  type EquipmentBooking, type InsertEquipmentBooking, type EventAnalytics, type InsertEventAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, or } from "drizzle-orm";

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

  // Event management
  getEvents(filters?: { status?: string; clubId?: number; organizerId?: number }): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Event approvals
  getEventApprovals(eventId: number): Promise<EventApproval[]>;
  createEventApproval(approval: InsertEventApproval): Promise<EventApproval>;
  updateEventApproval(id: number, updates: Partial<InsertEventApproval>): Promise<EventApproval | undefined>;

  // Event RSVPs
  getEventRsvps(eventId: number): Promise<EventRsvp[]>;
  getUserRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(id: number, updates: Partial<InsertEventRsvp>): Promise<EventRsvp | undefined>;

  // Resource management
  getResources(type?: string): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;

  // Resource bookings
  getResourceBookings(resourceId: number, startDate?: Date, endDate?: Date): Promise<ResourceBooking[]>;
  createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking>;
  updateResourceBooking(id: number, updates: Partial<InsertResourceBooking>): Promise<ResourceBooking | undefined>;

  // Social posts
  getSocialPosts(eventId?: number): Promise<SocialPost[]>;
  getSocialPost(id: number): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: number): Promise<boolean>;

  // Social comments
  getPostComments(postId: number): Promise<SocialComment[]>;
  createSocialComment(comment: InsertSocialComment): Promise<SocialComment>;

  // Social likes
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

  // Venues
  getVenues(type?: string): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, updates: Partial<InsertVenue>): Promise<Venue | undefined>;

  // Equipment
  getEquipment(type?: string): Promise<Equipment[]>;
  getEquipmentItem(id: number): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined>;

  // Equipment bookings
  getEquipmentBookings(equipmentId: number, startDate?: Date, endDate?: Date): Promise<EquipmentBooking[]>;
  createEquipmentBooking(booking: InsertEquipmentBooking): Promise<EquipmentBooking>;
  updateEquipmentBooking(id: number, updates: Partial<InsertEquipmentBooking>): Promise<EquipmentBooking | undefined>;

  // Event registration forms
  getEventRegistrationForms(eventId: number): Promise<EventRegistrationForm[]>;
  createEventRegistrationForm(form: InsertEventRegistrationForm): Promise<EventRegistrationForm>;

  // Event analytics
  getEventAnalytics(eventId: number): Promise<EventAnalytics | undefined>;
  createEventAnalytics(analytics: InsertEventAnalytics): Promise<EventAnalytics>;
  updateEventAnalytics(id: number, updates: Partial<InsertEventAnalytics>): Promise<EventAnalytics | undefined>;

  // Enhanced RSVP functions
  generateRsvpNumber(): string;
  verifyRsvpNumber(rsvpNumber: string, eventId: number): Promise<EventRsvp | undefined>;
}

export class DatabaseStorage implements IStorage {
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Club management
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs).where(eq(clubs.isActive, true)).orderBy(asc(clubs.name));
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

  // Event management
  async getEvents(filters?: { status?: string; clubId?: number; organizerId?: number }): Promise<Event[]> {
    let query = db.select().from(events);

    if (filters) {
      const conditions = [];
      if (filters.status) conditions.push(eq(events.status, filters.status));
      if (filters.clubId) conditions.push(eq(events.clubId, filters.clubId));
      if (filters.organizerId) conditions.push(eq(events.organizerId, filters.organizerId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query.orderBy(desc(events.createdAt));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event as any).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updates as any).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event approvals
  async getEventApprovals(eventId: number): Promise<EventApproval[]> {
    return await db.select().from(eventApprovals).where(eq(eventApprovals.eventId, eventId));
  }

  async createEventApproval(approval: InsertEventApproval): Promise<EventApproval> {
    const [newApproval] = await db.insert(eventApprovals).values(approval).returning();
    return newApproval;
  }

  async updateEventApproval(id: number, updates: Partial<InsertEventApproval>): Promise<EventApproval | undefined> {
    const [approval] = await db.update(eventApprovals).set(updates).where(eq(eventApprovals.id, id)).returning();
    return approval || undefined;
  }

  // Event RSVPs
  async getEventRsvps(eventId: number): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getUserRsvp(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.select().from(eventRsvps)
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
    let query = db.select().from(resources);
    if (type) {
      query = query.where(eq(resources.type, type));
    }
    return await query.orderBy(asc(resources.name));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  // Resource bookings
  async getResourceBookings(resourceId: number, startDate?: Date, endDate?: Date): Promise<ResourceBooking[]> {
    let query = db.select().from(resourceBookings).where(eq(resourceBookings.resourceId, resourceId));

    if (startDate && endDate) {
      query = query.where(and(
        eq(resourceBookings.resourceId, resourceId),
        or(
          and(gte(resourceBookings.startTime, startDate), lte(resourceBookings.startTime, endDate)),
          and(gte(resourceBookings.endTime, startDate), lte(resourceBookings.endTime, endDate))
        )
      ));
    }

    return await query.orderBy(asc(resourceBookings.startTime));
  }

  async createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking> {
    const [newBooking] = await db.insert(resourceBookings).values(booking).returning();
    return newBooking;
  }

  async updateResourceBooking(id: number, updates: Partial<InsertResourceBooking>): Promise<ResourceBooking | undefined> {
    const [booking] = await db.update(resourceBookings).set(updates).where(eq(resourceBookings.id, id)).returning();
    return booking || undefined;
  }

  // Social posts
  async getSocialPosts(eventId?: number): Promise<SocialPost[]> {
    let query = db.select().from(socialPosts);
    if (eventId) {
      query = query.where(eq(socialPosts.eventId, eventId));
    }
    return await query.orderBy(desc(socialPosts.createdAt));
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
    return result.rowCount > 0;
  }

  // Social comments
  async getPostComments(postId: number): Promise<SocialComment[]> {
    return await db.select().from(socialComments)
      .where(eq(socialComments.postId, postId))
      .orderBy(asc(socialComments.createdAt));
  }

  async createSocialComment(comment: InsertSocialComment): Promise<SocialComment> {
    const [newComment] = await db.insert(socialComments).values(comment).returning();

    // Update comments count
    await db.update(socialPosts)
      .set({ commentsCount: sql`${socialPosts.commentsCount} + 1` })
      .where(eq(socialPosts.id, comment.postId));

    return newComment;
  }

  // Social likes
  async getPostLike(postId: number, userId: number): Promise<boolean> {
    const [like] = await db.select().from(socialLikes)
      .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId)));
    return !!like;
  }

  async togglePostLike(postId: number, userId: number): Promise<boolean> {
    const existingLike = await this.getPostLike(postId, userId);

    if (existingLike) {
      await db.delete(socialLikes)
        .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId)));

      await db.update(socialPosts)
        .set({ likesCount: sql`${socialPosts.likesCount} - 1` })
        .where(eq(socialPosts.id, postId));

      return false;
    } else {
      await db.insert(socialLikes).values({ postId, userId });

      await db.update(socialPosts)
        .set({ likesCount: sql`${socialPosts.likesCount} + 1` })
        .where(eq(socialPosts.id, postId));

      return true;
    }
  }

  // Event feedback
  async getEventFeedback(eventId: number): Promise<EventFeedback[]> {
    return await db.select().from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId))
      .orderBy(desc(eventFeedback.createdAt));
  }

  async createEventFeedback(feedback: InsertEventFeedback): Promise<EventFeedback> {
    const [newFeedback] = await db.insert(eventFeedback).values(feedback).returning();
    return newFeedback;
  }

  // Event photos
  async getEventPhotos(eventId: number): Promise<EventPhoto[]> {
    return await db.select().from(eventPhotos)
      .where(eq(eventPhotos.eventId, eventId))
      .orderBy(desc(eventPhotos.createdAt));
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
    const [response] = await db.select().from(pollResponses)
      .where(and(eq(pollResponses.pollId, pollId), eq(pollResponses.userId, userId)));
    return response || undefined;
  }

  async createPollResponse(response: InsertPollResponse): Promise<PollResponse> {
    const [newResponse] = await db.insert(pollResponses).values(response).returning();
    return newResponse;
  }

  // Venues
  async getVenues(type?: string): Promise<Venue[]> {
    let query = db.select().from(venues);
    if (type) {
      query = query.where(eq(venues.type, type));
    }
    return await query.orderBy(asc(venues.name));
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
    let query = db.select().from(equipment);
    if (type) {
      query = query.where(eq(equipment.type, type));
    }
    return await query.orderBy(asc(equipment.name));
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
      query = query.where(and(
        eq(equipmentBookings.equipmentId, equipmentId),
        or(
          and(gte(equipmentBookings.startTime, startDate), lte(equipmentBookings.startTime, endDate)),
          and(gte(equipmentBookings.endTime, startDate), lte(equipmentBookings.endTime, endDate))
        )
      ));
    }

    return await query.orderBy(asc(equipmentBookings.startTime));
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
    const random = Math.random().toString(36).substring(2, 8);
    return `RSVP-${timestamp}-${random}`.toUpperCase();
  }

  async verifyRsvpNumber(rsvpNumber: string, eventId: number): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.rsvpNumber, rsvpNumber), eq(eventRsvps.eventId, eventId)));
    return rsvp || undefined;
  }
}

class FixedDatabaseStorage extends DatabaseStorage {
  private events: any[] = [
    {
      id: 1,
      name: 'Sample Event',
      description: 'This is a sample event for testing purposes.',
      status: 'published',
      clubId: 1,
      organizerId: 1,
      createdAt: new Date().toISOString()
    }
  ];
  private venues: any[] = [
    {
      id: 1,
      name: 'Sample Venue',
      address: '123 Main St',
      type: 'hall',
      capacity: 100,
      isAvailable: true,
      createdAt: new Date().toISOString()
    }
  ];
  private equipment: any[] = [
    {
      id: 1,
      name: 'Projector',
      type: 'AV',
      isAvailable: true,
      createdAt: new Date().toISOString()
    }
  ];
  private bookings: any[] = [];

  async updateEvent(eventId: number, updates: any) {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      Object.assign(event, updates);
      return event;
    }
    return null;
  }

  async getAllVenues() {
    return this.venues;
  }

  async createVenue(venueData: any) {
    const venue = {
      id: this.venues.length + 1,
      ...venueData,
      isAvailable: true,
      createdAt: new Date().toISOString()
    };
    this.venues.push(venue);
    return venue;
  }

  async updateVenueAvailability(venueId: number, isAvailable: boolean) {
    const venue = this.venues.find(v => v.id === venueId);
    if (venue) {
      venue.isAvailable = isAvailable;
      return true;
    }
    return false;
  }

  async getAllEquipment() {
    return this.equipment;
  }

  async createEquipment(equipmentData: any) {
    const equipment = {
      id: this.equipment.length + 1,
      ...equipmentData,
      isAvailable: true,
      createdAt: new Date().toISOString()
    };
    this.equipment.push(equipment);
    return equipment;
  }

  async updateEquipmentAvailability(equipmentId: number, isAvailable: boolean) {
    const equipment = this.equipment.find(e => e.id === equipmentId);
    if (equipment) {
      equipment.isAvailable = isAvailable;
      return true;
    }
    return false;
  }

  async getAllBookings() {
    return this.bookings || [];
  }
}

export const storage = new FixedDatabaseStorage();