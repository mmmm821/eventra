import type {
  Event,
  TicketType,
  Venue,
  Ticket,
  Booking,
  User,
  Seat,
} from "@prisma/client";

export type EventWithRelations = Event & {
  venue: Venue | null;
  ticketTypes: TicketType[];
  organizer: Pick<User, "id" | "name" | "image">;
  _count?: { favorites: number; tickets: number };
};

export type TicketWithRelations = Ticket & {
  event: Event;
  ticketType: TicketType;
  seat: Seat | null;
};

export type BookingWithRelations = Booking & {
  event: Event;
  items: { quantity: number; unitPrice: number; ticketType: TicketType }[];
};

export const EVENT_CATEGORIES = [
  "Concerts",
  "Sports",
  "Comedy",
  "Technology",
  "Workshops",
  "College",
  "Cultural",
  "Food",
  "Gaming",
  "Business",
  "Networking",
  "Exhibitions",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
