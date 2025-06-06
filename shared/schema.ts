import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'student', 'club_member', 'club_head', 'teacher', 'hod', 'registrar', 'financial_head', 'technical_staff', 'admin'
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  clubId: integer("club_id"),
  division: text("division"), // For students: "First Year", "Second Year", etc.
  department: text("department"), // For teachers/HODs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  headId: integer("head_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'academic', 'cultural', 'sports', 'technical', 'social'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  maxAttendees: integer("max_attendees"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'cancelled', 'published'
  organizerId: integer("organizer_id").notNull(),
  clubId: integer("club_id"),
  imageUrl: text("image_url"),
  requiresApproval: boolean("requires_approval").default(true),
  eventType: text("event_type").notNull().default("audience"), // 'audience', 'participation', 'mixed'
  divisionRestriction: text("division_restriction"), // 'First Year', 'Second Year', etc. or null for all
  departmentRestriction: text("department_restriction"), // Specific department or null for all
  managementTeam: json("management_team").$type<{userId: number, role: string}[]>().default([]),
  postType: text("post_type").default("pre-event"), // 'pre-event', 'during-event', 'post-event'
  registrationDeadline: timestamp("registration_deadline"),
  equipmentRequired: json("equipment_required").$type<string[]>().default([]),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventApprovals = pgTable("event_approvals", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  approverId: integer("approver_id").notNull(),
  approverRole: text("approver_role").notNull(), // 'teacher', 'registrar', 'financial_head'
  status: text("status").notNull(), // 'pending', 'approved', 'rejected'
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("attending"), // 'attending', 'maybe', 'not_attending'
  registrationType: text("registration_type").notNull().default("audience"), // 'audience', 'participant'
  rsvpNumber: text("rsvp_number").notNull().unique(),
  formData: json("form_data").$type<Record<string, any>>(),
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'verified', 'attended'
  createdAt: timestamp("created_at").defaultNow(),
});

// New tables for enhanced functionality
export const eventPolls = pgTable("event_polls", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  isActive: boolean("is_active").default(true),
  visibleToAttendeesOnly: boolean("visible_to_attendees_only").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollResponses = pgTable("poll_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  userId: integer("user_id").notNull(),
  selectedOption: integer("selected_option").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubMemberships = pgTable("club_memberships", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member"), // 'member', 'lead', 'head'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const eventRegistrationForms = pgTable("event_registration_forms", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  formType: text("form_type").notNull(), // 'audience', 'participant'
  formFields: json("form_fields").$type<{name: string, type: string, required: boolean, options?: string[]}[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'auditorium', 'hall', 'classroom', 'ground'
  capacity: integer("capacity").notNull(),
  location: text("location"),
  amenities: json("amenities").$type<string[]>().default([]),
  isAvailable: boolean("is_available").default(true),
  bookingRules: text("booking_rules"),
  createdBy: integer("created_by"), // User ID who created this venue
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const venueSchedules = pgTable("venue_schedules", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  recurringType: text("recurring_type").default("weekly"), // 'weekly', 'daily', 'one-time'
  specificDate: timestamp("specific_date"), // For one-time schedules
  notes: text("notes"),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'audio', 'visual', 'lighting', 'decoration'
  quantity: integer("quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  specifications: json("specifications").$type<Record<string, any>>(),
  maintenanceStatus: text("maintenance_status").default("good"), // 'good', 'needs_repair', 'out_of_order'
  createdBy: integer("created_by"), // User ID who created this equipment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const equipmentSchedules = pgTable("equipment_schedules", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  recurringType: text("recurring_type").default("weekly"), // 'weekly', 'daily', 'one-time'
  specificDate: timestamp("specific_date"), // For one-time schedules
  notes: text("notes"),
});

export const equipmentBookings = pgTable("equipment_bookings", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  eventId: integer("event_id").notNull(),
  quantity: integer("quantity").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventAnalytics = pgTable("event_analytics", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  totalRegistrations: integer("total_registrations").default(0),
  audienceRegistrations: integer("audience_registrations").default(0),
  participantRegistrations: integer("participant_registrations").default(0),
  actualAttendance: integer("actual_attendance").default(0),
  feedbackResponses: integer("feedback_responses").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  engagementMetrics: json("engagement_metrics").$type<Record<string, any>>(),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'auditorium', 'conference_room', 'equipment', 'catering'
  description: text("description"),
  capacity: integer("capacity"),
  isAvailable: boolean("is_available").default(true),
  costPerHour: decimal("cost_per_hour", { precision: 8, scale: 2 }),
});

export const resourceBookings = pgTable("resource_bookings", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull(),
  eventId: integer("event_id"),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  eventId: integer("event_id"),
  imageUrls: json("image_urls").$type<string[]>(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialComments = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialLikes = pgTable("social_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventFeedback = pgTable("event_feedback", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventPhotos = pgTable("event_photos", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  club: one(clubs, { fields: [users.clubId], references: [clubs.id] }),
  organizedEvents: many(events),
  rsvps: many(eventRsvps),
  posts: many(socialPosts),
  comments: many(socialComments),
  likes: many(socialLikes),
  feedback: many(eventFeedback),
  photos: many(eventPhotos),
  clubMemberships: many(clubMemberships),
  pollResponses: many(pollResponses),
}));

export const clubMembershipsRelations = relations(clubMemberships, ({ one }) => ({
  club: one(clubs, { fields: [clubMemberships.clubId], references: [clubs.id] }),
  user: one(users, { fields: [clubMemberships.userId], references: [users.id] }),
}));

export const eventPollsRelations = relations(eventPolls, ({ one, many }) => ({
  event: one(events, { fields: [eventPolls.eventId], references: [events.id] }),
  responses: many(pollResponses),
}));

export const pollResponsesRelations = relations(pollResponses, ({ one }) => ({
  poll: one(eventPolls, { fields: [pollResponses.pollId], references: [eventPolls.id] }),
  user: one(users, { fields: [pollResponses.userId], references: [users.id] }),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  bookings: many(resourceBookings),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  bookings: many(equipmentBookings),
}));

export const equipmentBookingsRelations = relations(equipmentBookings, ({ one }) => ({
  equipment: one(equipment, { fields: [equipmentBookings.equipmentId], references: [equipment.id] }),
  event: one(events, { fields: [equipmentBookings.eventId], references: [events.id] }),
}));

export const eventAnalyticsRelations = relations(eventAnalytics, ({ one }) => ({
  event: one(events, { fields: [eventAnalytics.eventId], references: [events.id] }),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  head: one(users, { fields: [clubs.headId], references: [users.id] }),
  members: many(users),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  club: one(clubs, { fields: [events.clubId], references: [clubs.id] }),
  approvals: many(eventApprovals),
  rsvps: many(eventRsvps),
  resourceBookings: many(resourceBookings),
  posts: many(socialPosts),
  feedback: many(eventFeedback),
  photos: many(eventPhotos),
}));

export const eventApprovalsRelations = relations(eventApprovals, ({ one }) => ({
  event: one(events, { fields: [eventApprovals.eventId], references: [events.id] }),
  approver: one(users, { fields: [eventApprovals.approverId], references: [users.id] }),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRsvps.userId], references: [users.id] }),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
  bookings: many(resourceBookings),
}));

export const resourceBookingsRelations = relations(resourceBookings, ({ one }) => ({
  resource: one(resources, { fields: [resourceBookings.resourceId], references: [resources.id] }),
  event: one(events, { fields: [resourceBookings.eventId], references: [events.id] }),
  user: one(users, { fields: [resourceBookings.userId], references: [users.id] }),
}));

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  author: one(users, { fields: [socialPosts.authorId], references: [users.id] }),
  event: one(events, { fields: [socialPosts.eventId], references: [events.id] }),
  comments: many(socialComments),
  likes: many(socialLikes),
}));

export const socialCommentsRelations = relations(socialComments, ({ one }) => ({
  post: one(socialPosts, { fields: [socialComments.postId], references: [socialPosts.id] }),
  author: one(users, { fields: [socialComments.authorId], references: [users.id] }),
}));

export const socialLikesRelations = relations(socialLikes, ({ one }) => ({
  post: one(socialPosts, { fields: [socialLikes.postId], references: [socialPosts.id] }),
  user: one(users, { fields: [socialLikes.userId], references: [users.id] }),
}));

export const eventFeedbackRelations = relations(eventFeedback, ({ one }) => ({
  event: one(events, { fields: [eventFeedback.eventId], references: [events.id] }),
  user: one(users, { fields: [eventFeedback.userId], references: [users.id] }),
}));

export const eventPhotosRelations = relations(eventPhotos, ({ one }) => ({
  event: one(events, { fields: [eventPhotos.eventId], references: [events.id] }),
  user: one(users, { fields: [eventPhotos.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventApprovalSchema = createInsertSchema(eventApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
  rsvpNumber: true, // This will be auto-generated
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export const insertResourceBookingSchema = createInsertSchema(resourceBookings).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  commentsCount: true,
});

export const insertSocialCommentSchema = createInsertSchema(socialComments).omit({
  id: true,
  createdAt: true,
});

export const insertEventFeedbackSchema = createInsertSchema(eventFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertEventPhotoSchema = createInsertSchema(eventPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertEventPollSchema = createInsertSchema(eventPolls).omit({
  id: true,
  createdAt: true,
});

export const insertPollResponseSchema = createInsertSchema(pollResponses).omit({
  id: true,
  createdAt: true,
});

export const insertClubMembershipSchema = createInsertSchema(clubMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertEventRegistrationFormSchema = createInsertSchema(eventRegistrationForms).omit({
  id: true,
  createdAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export const insertEquipmentBookingSchema = createInsertSchema(equipmentBookings).omit({
  id: true,
  createdAt: true,
});

export const insertEventAnalyticsSchema = createInsertSchema(eventAnalytics).omit({
  id: true,
  generatedAt: true,
});

export const insertVenueScheduleSchema = createInsertSchema(venueSchedules).omit({
  id: true,
});

export const insertEquipmentScheduleSchema = createInsertSchema(equipmentSchedules).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventApproval = typeof eventApprovals.$inferSelect;
export type InsertEventApproval = z.infer<typeof insertEventApprovalSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ResourceBooking = typeof resourceBookings.$inferSelect;
export type InsertResourceBooking = z.infer<typeof insertResourceBookingSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialComment = typeof socialComments.$inferSelect;
export type InsertSocialComment = z.infer<typeof insertSocialCommentSchema>;
export type EventFeedback = typeof eventFeedback.$inferSelect;
export type InsertEventFeedback = z.infer<typeof insertEventFeedbackSchema>;
export type EventPhoto = typeof eventPhotos.$inferSelect;
export type InsertEventPhoto = z.infer<typeof insertEventPhotoSchema>;
export type EventPoll = typeof eventPolls.$inferSelect;
export type InsertEventPoll = z.infer<typeof insertEventPollSchema>;
export type PollResponse = typeof pollResponses.$inferSelect;
export type InsertPollResponse = z.infer<typeof insertPollResponseSchema>;
export type ClubMembership = typeof clubMemberships.$inferSelect;
export type InsertClubMembership = z.infer<typeof insertClubMembershipSchema>;
export type EventRegistrationForm = typeof eventRegistrationForms.$inferSelect;
export type InsertEventRegistrationForm = z.infer<typeof insertEventRegistrationFormSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type EquipmentBooking = typeof equipmentBookings.$inferSelect;
export type InsertEquipmentBooking = z.infer<typeof insertEquipmentBookingSchema>;
export type EventAnalytics = typeof eventAnalytics.$inferSelect;
export type InsertEventAnalytics = z.infer<typeof insertEventAnalyticsSchema>;
export type VenueSchedule = typeof venueSchedules.$inferSelect;
export type InsertVenueSchedule = z.infer<typeof insertVenueScheduleSchema>;
export type EquipmentSchedule = typeof equipmentSchedules.$inferSelect;
export type InsertEquipmentSchedule = z.infer<typeof insertEquipmentScheduleSchema>;
