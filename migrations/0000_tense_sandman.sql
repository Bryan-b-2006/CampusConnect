CREATE TABLE "club_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"head_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"specifications" json,
	"maintenance_status" text DEFAULT 'good'
);
--> statement-breakpoint
CREATE TABLE "equipment_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"total_registrations" integer DEFAULT 0,
	"audience_registrations" integer DEFAULT 0,
	"participant_registrations" integer DEFAULT 0,
	"actual_attendance" integer DEFAULT 0,
	"feedback_responses" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"engagement_metrics" json,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"approver_id" integer NOT NULL,
	"approver_role" text NOT NULL,
	"status" text NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"is_active" boolean DEFAULT true,
	"visible_to_attendees_only" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_registration_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"form_type" text NOT NULL,
	"form_fields" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'attending' NOT NULL,
	"registration_type" text DEFAULT 'audience' NOT NULL,
	"rsvp_number" text NOT NULL,
	"form_data" json,
	"verification_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "event_rsvps_rsvp_number_unique" UNIQUE("rsvp_number")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"location" text,
	"max_attendees" integer,
	"budget" numeric(10, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"organizer_id" integer NOT NULL,
	"club_id" integer,
	"image_url" text,
	"requires_approval" boolean DEFAULT true,
	"event_type" text DEFAULT 'audience' NOT NULL,
	"division_restriction" text,
	"department_restriction" text,
	"management_team" json DEFAULT '[]'::json,
	"post_type" text DEFAULT 'pre-event',
	"registration_deadline" timestamp,
	"equipment_required" json DEFAULT '[]'::json,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "poll_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"selected_option" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"event_id" integer,
	"user_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"capacity" integer,
	"is_available" boolean DEFAULT true,
	"cost_per_hour" numeric(8, 2)
);
--> statement-breakpoint
CREATE TABLE "social_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"event_id" integer,
	"image_urls" json,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"bio" text,
	"profile_picture" text,
	"club_id" integer,
	"division" text,
	"department" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"capacity" integer NOT NULL,
	"location" text,
	"amenities" json DEFAULT '[]'::json,
	"is_available" boolean DEFAULT true,
	"booking_rules" text
);
