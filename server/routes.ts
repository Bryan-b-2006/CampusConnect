import type { Express } from "express";
import { createServer, type Server } from "http";
import { ComprehensiveStorage } from "./storage-new";

const storage = new ComprehensiveStorage();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, insertEventSchema, insertSocialPostSchema, insertEventRsvpSchema, insertEventFeedbackSchema,
  insertEventPollSchema, insertPollResponseSchema, insertClubMembershipSchema, insertEventRegistrationFormSchema,
  insertVenueSchema, insertEquipmentSchema, insertEquipmentBookingSchema, insertEventAnalyticsSchema
} from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware for authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // User routes
  app.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Users can only update their own profile
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Club routes
  app.get("/api/clubs", authenticateToken, async (req, res) => {
    try {
      const clubs = await storage.getClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  // Event routes
  app.get("/api/events", authenticateToken, async (req, res) => {
    try {
      const { status, clubId, organizerId } = req.query;
      const filters: any = {};

      if (status) filters.status = status as string;
      if (clubId) filters.clubId = parseInt(clubId as string);
      if (organizerId) filters.organizerId = parseInt(organizerId as string);

      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", authenticateToken, async (req: any, res) => {
    try {
      const requestData = {
        ...req.body,
        organizerId: req.user.id,
      };

      // Convert date strings to Date objects
      if (requestData.startDate) {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate) {
        requestData.endDate = new Date(requestData.endDate);
      }
      if (requestData.registrationDeadline) {
        requestData.registrationDeadline = new Date(requestData.registrationDeadline);
      }

      // HODs can create events without approval
      if (req.user.role === 'hod') {
        requestData.status = 'approved';
        requestData.requiresApproval = false;
      }

      const eventData = insertEventSchema.parse(requestData);
      const event = await storage.createEvent(eventData);

      // Create approval workflow for non-HOD users
      if (req.user.role !== 'hod' && event.requiresApproval) {
        // Create initial approval requests for teachers and admin
        const approverRoles = ['teacher', 'registrar'];
        for (const role of approverRoles) {
          await storage.createEventApproval({
            eventId: event.id,
            approverId: req.user.id, // Will be assigned to actual approvers
            approverRole: role,
            status: 'pending'
          });
        }
      }

      res.status(201).json(event);
    } catch (error) {
      console.error('Event creation error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create event" });
    }
  });

  app.put("/api/events/:id", authenticateToken, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check permissions
      if (event.organizerId !== req.user.id && 
          !['admin', 'teacher', 'registrar', 'financial_head'].includes(req.user.role)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedEvent = await storage.updateEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", authenticateToken, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check permissions
      if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const success = await storage.deleteEvent(eventId);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event RSVP routes
  app.get("/api/events/:id/rsvps", authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rsvps = await storage.getEventRsvps(eventId);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.post("/api/events/:id/rsvp", authenticateToken, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { status, registrationType, formData } = req.body;

      // Get event details to check capacity and restrictions
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check division restrictions
      if (event.divisionRestriction && req.user.division !== event.divisionRestriction) {
        return res.status(403).json({ message: "This event is restricted to " + event.divisionRestriction });
      }

      // Check department restrictions
      if (event.departmentRestriction && req.user.department !== event.departmentRestriction) {
        return res.status(403).json({ message: "This event is restricted to " + event.departmentRestriction });
      }

      // Check capacity
      const existingRsvps = await storage.getEventRsvps(eventId);
      if (event.maxAttendees && existingRsvps.length >= event.maxAttendees) {
        return res.status(400).json({ message: "Event is at full capacity" });
      }

      // Check if user already has an RSVP
      const existingRsvp = await storage.getUserRsvp(eventId, req.user.id);

      if (existingRsvp) {
        const updatedRsvp = await storage.updateEventRsvp(existingRsvp.id, { 
          status,
          registrationType: registrationType || existingRsvp.registrationType,
          formData: formData || existingRsvp.formData
        });
        res.json(updatedRsvp);
      } else {
        const rsvp = await storage.createEventRsvp({
          eventId,
          userId: req.user.id,
          status: status || 'attending',
          registrationType: registrationType || 'audience',
          formData: formData || {}
        });
        res.status(201).json(rsvp);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  // Resource routes
  app.get("/api/resources", authenticateToken, async (req, res) => {
    try {
      const { type } = req.query;
      const resources = await storage.getResources(type as string);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id/bookings", authenticateToken, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const bookings = await storage.getResourceBookings(resourceId, start, end);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/resources/:id/book", authenticateToken, async (req: any, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { startTime, endTime, eventId, notes } = req.body;

      const booking = await storage.createResourceBooking({
        resourceId,
        eventId,
        userId: req.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      });

      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Social post routes
  app.get("/api/social/posts", authenticateToken, async (req, res) => {
    try {
      const { eventId } = req.query;
      const posts = await storage.getSocialPosts(eventId ? parseInt(eventId as string) : undefined);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/social/posts", authenticateToken, async (req: any, res) => {
    try {
      const postData = insertSocialPostSchema.parse({
        ...req.body,
        authorId: req.user.id,
      });

      const post = await storage.createSocialPost(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/social/posts/:id/comments", authenticateToken, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/social/posts/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;

      const comment = await storage.createSocialComment({
        postId,
        authorId: req.user.id,
        content,
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post("/api/social/posts/:id/like", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const isLiked = await storage.togglePostLike(postId, req.user.id);
      res.json({ liked: isLiked });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Event feedback routes
  app.get("/api/events/:id/feedback", authenticateToken, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const feedback = await storage.getEventFeedback(eventId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/events/:id/feedback", authenticateToken, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const feedbackData = insertEventFeedbackSchema.parse({
        ...req.body,
        eventId,
        userId: req.user.id,
      });

      const feedback = await storage.createEventFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      res.status(400).json({ message: "Failed to submit feedback" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/dashboard", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const dashboardData = await storage.getUserDashboardData(req.user.id);
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  app.get("/api/admin/pending-approvals", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const pendingApprovals = await storage.getPendingApprovalsForAdmin();
      res.json(pendingApprovals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/admin/events/:id/approve", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { comments } = req.body;

      const success = await storage.approveEventAsAdmin(eventId, req.user.id, comments);
      if (success) {
        // Update event status to approved
        await storage.updateEvent(eventId, { status: 'approved' });
        res.json({ message: "Event approved successfully" });
      } else {
        res.status(400).json({ message: "Failed to approve event" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to approve event" });
    }
  });

  app.post("/api/admin/events/:id/reject", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { comments } = req.body;

      const success = await storage.rejectEventAsAdmin(eventId, req.user.id, comments);
      if (success) {
        // Update event status to rejected
        await storage.updateEvent(eventId, { status: 'rejected' });
        res.json({ message: "Event rejected successfully" });
      } else {
        res.status(400).json({ message: "Failed to reject event" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to reject event" });
    }
  });

  // Venue management routes
  app.get("/api/venues", authenticateToken, async (req: any, res) => {
    try {
      const venues = await storage.getAllVenues();
      res.json(venues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.post("/api/venues", authenticateToken, requireRole(['admin', 'technical']), async (req: any, res) => {
    try {
      const venueData = req.body;
      const venue = await storage.createVenue(venueData);
      res.json(venue);
    } catch (error) {
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.patch("/api/venues/:id/availability", authenticateToken, requireRole(['admin', 'technical']), async (req: any, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const { isAvailable } = req.body;
      const success = await storage.updateVenueAvailability(venueId, isAvailable);
      if (success) {
        res.json({ message: "Venue availability updated" });
      } else {
        res.status(400).json({ message: "Failed to update venue availability" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update venue availability" });
    }
  });

  // Equipment management routes
  app.get("/api/equipment", authenticateToken, async (req: any, res) => {
    try {
      const equipment = await storage.getAllEquipment();
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", authenticateToken, requireRole(['admin', 'technical']), async (req: any, res) => {
    try {
      const equipmentData = req.body;
      const equipment = await storage.createEquipment(equipmentData);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id/availability", authenticateToken, requireRole(['admin', 'technical']), async (req: any, res) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const { isAvailable } = req.body;
      const success = await storage.updateEquipmentAvailability(equipmentId, isAvailable);
      if (success) {
        res.json({ message: "Equipment availability updated" });
      } else {
        res.status(400).json({ message: "Failed to update equipment availability" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment availability" });
    }
  });

  // Bookings route
  app.get("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}