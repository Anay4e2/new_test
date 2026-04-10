import { z } from 'zod';

// ─── Auth Schemas ───

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  avatar: z.string().max(500).trim().optional(),
  interests: z.array(z.string().max(50).trim()).max(20).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: 'At least one field must be provided',
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
});

// ─── Trip Schemas ───

export const generateTripSchema = z.object({
  stateCode: z.string().optional(),
  stateCodes: z.array(z.string()).optional(),
  selectedCityIds: z.array(z.string()).min(1, 'Select at least one city'),
  duration: z.coerce.number().int().min(1, 'Duration must be at least 1 day').max(30, 'Duration cannot exceed 30 days'),
  budget: z.enum(['budget', 'standard', 'premium'], { message: 'Invalid budget tier' }),
  travelStyle: z.enum(['relaxed', 'fast'], { message: 'Invalid travel style' }),
  constraints: z.object({
    maxTravelHoursPerDay: z.coerce.number().min(1).max(16).default(6),
    seniorFriendly: z.boolean().default(false),
    morningReligious: z.boolean().default(false),
    noNightTravel: z.boolean().default(false),
  }).default(() => ({
    maxTravelHoursPerDay: 6,
    seniorFriendly: false,
    morningReligious: false,
    noNightTravel: false,
  })),
});

export const optimizeRouteSchema = z.object({
  placeIds: z.array(z.string()).min(1, 'Provide at least one place'),
  startCityName: z.string().optional(),
});

// ─── Saved Trip Schemas ───

export const saveTripSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  tripRequest: z.record(z.string(), z.any()),
  tripResult: z.record(z.string(), z.any()),
});

export const updateTripSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  notes: z.string().max(1000, 'Notes too long').trim().optional(),
  isFavorite: z.boolean().optional(),
});

// ─── Expense Schemas ───

export const addExpenseSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  category: z.enum(['stay', 'transport', 'food', 'activities', 'shopping', 'tips', 'other']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().max(500).trim().optional(),
  day: z.coerce.number().int().min(1),
  city: z.string().max(100).trim().optional(),
  paymentMethod: z.string().max(50).trim().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(['stay', 'transport', 'food', 'activities', 'shopping', 'tips', 'other']).optional(),
  amount: z.coerce.number().positive().optional(),
  description: z.string().max(500).trim().optional(),
  day: z.coerce.number().int().min(1).optional(),
  city: z.string().max(100).trim().optional(),
  paymentMethod: z.string().max(50).trim().optional(),
});

// ─── Group Schemas ───

export const createGroupSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  name: z.string().min(1, 'Group name is required').max(100).trim(),
});

export const inviteMembersSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email required').max(20),
  role: z.enum(['editor', 'viewer']).default('viewer'),
  message: z.string().max(500).trim().optional(),
});

export const respondInviteSchema = z.object({
  response: z.enum(['accepted', 'declined']),
});

// ─── Review Schemas ───

export const createReviewSchema = z.object({
  placeId: z.string().min(1, 'Place ID is required'),
  placeName: z.string().min(1).max(200).trim(),
  cityName: z.string().max(100).trim().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).trim().optional(),
  comment: z.string().max(2000).trim().optional(),
  visitDate: z.string().optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

// ─── Journal Schemas ───

export const createJournalSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  day: z.coerce.number().int().min(1),
  city: z.string().min(1).max(100).trim(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  content: z.string().max(5000).trim().optional(),
  mood: z.string().max(50).trim().optional(),
  photos: z.array(z.string().url()).max(10).optional(),
  placeName: z.string().max(200).trim().optional(),
  isPublic: z.boolean().default(false),
});

// ─── Poll Schemas ───

export const createPollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(300).trim(),
  options: z.array(z.string().min(1).max(200).trim()).min(2, 'At least 2 options').max(10),
});

export const votePollSchema = z.object({
  optionIndex: z.coerce.number().int().min(0),
});

// ─── Itinerary Request Schemas ───

export const createItineraryRequestSchema = z.object({
  type: z.enum(['add_activity', 'remove_activity', 'change_hotel', 'change_date', 'modify_route', 'custom']),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().min(1, 'Description is required').max(1000).trim(),
  dayNumber: z.coerce.number().int().min(1).optional(),
  proposedChanges: z.record(z.string(), z.any()).optional(),
});

export const voteRequestSchema = z.object({
  vote: z.enum(['approve', 'reject']),
});

export const resolveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).trim().optional(),
});

// ─── Mongo ObjectId param validation ───

export const objectIdParam = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});
