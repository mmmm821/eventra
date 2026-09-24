import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().min(10, "Enter a valid phone number.").max(15),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    role: z.enum(["ATTENDEE", "ORGANIZER"]),
    organization: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "ORGANIZER" || !!data.organization?.trim(), {
    message: "Tell us your organization or club name.",
    path: ["organization"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Enter your password."),
});

export const ticketTypeSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().int().min(0), // paise
  quantityTotal: z.number().int().min(1),
  saleStart: z.string().datetime().optional().nullable(),
  saleEnd: z.string().datetime().optional().nullable(),
  isGroupTicket: z.boolean().default(false),
  maxPerOrder: z.number().int().min(1).max(50).default(10),
});

export const createEventSchema = z.object({
  title: z.string().min(4, "Give the event a name."),
  description: z.string().min(20, "Add a bit more detail for attendees."),
  category: z.string(),
  audience: z.enum(["COLLEGE", "PUBLIC"]),
  format: z.enum(["ONLINE", "OFFLINE"]),
  ticketMode: z.enum(["GENERAL_ADMISSION", "SEAT_BASED"]),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  ageRestriction: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  terms: z.string().optional(),
  ticketTypes: z.array(ticketTypeSchema).min(1, "Add at least one ticket type."),
});

export const createOrderSchema = z.object({
  eventId: z.string(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
  seatIds: z.array(z.string()).optional(),
  attendeeName: z.string().min(2),
  couponCode: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  bookingId: z.string(),
});

export const verifyTicketSchema = z.object({
  token: z.string().min(10),
  eventId: z.string(),
});

export const reviewSchema = z.object({
  eventId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
