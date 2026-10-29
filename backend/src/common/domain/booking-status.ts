import { BookingActorRole } from './enums';

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WORK_DONE = 'WORK_DONE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface BookingTransitionRule {
  from: BookingStatus;
  to: BookingStatus;
  allowedActors: readonly BookingActorRole[];
  releasesSlots: boolean;
  locksSlots: boolean;
}

export const TERMINAL_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.COMPLETED,
  BookingStatus.REJECTED,
  BookingStatus.CANCELLED,
  BookingStatus.EXPIRED,
]);

/**
 * Canonical V1 booking state transition rules matching docs/01-product/BOOKING_LIFECYCLE.md.
 */
export const BOOKING_TRANSITION_RULES: readonly BookingTransitionRule[] = [
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.ACCEPTED,
    allowedActors: [BookingActorRole.PROVIDER],
    locksSlots: true,
    releasesSlots: false,
  },
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.REJECTED,
    allowedActors: [BookingActorRole.PROVIDER],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.CANCELLED,
    allowedActors: [BookingActorRole.CUSTOMER, BookingActorRole.ADMIN],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.REQUESTED,
    to: BookingStatus.EXPIRED,
    allowedActors: [BookingActorRole.SYSTEM, BookingActorRole.ADMIN],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.ACCEPTED,
    to: BookingStatus.IN_PROGRESS,
    allowedActors: [BookingActorRole.PROVIDER],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.ACCEPTED,
    to: BookingStatus.CANCELLED,
    allowedActors: [
      BookingActorRole.CUSTOMER,
      BookingActorRole.PROVIDER,
      BookingActorRole.ADMIN,
    ],
    locksSlots: false,
    releasesSlots: true,
  },
  {
    from: BookingStatus.IN_PROGRESS,
    to: BookingStatus.WORK_DONE,
    allowedActors: [BookingActorRole.PROVIDER],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.IN_PROGRESS,
    to: BookingStatus.CANCELLED,
    allowedActors: [BookingActorRole.ADMIN],
    locksSlots: false,
    releasesSlots: true,
  },
  {
    from: BookingStatus.WORK_DONE,
    to: BookingStatus.COMPLETED,
    allowedActors: [BookingActorRole.CUSTOMER, BookingActorRole.ADMIN],
    locksSlots: false,
    releasesSlots: false,
  },
  {
    from: BookingStatus.WORK_DONE,
    to: BookingStatus.CANCELLED,
    allowedActors: [BookingActorRole.ADMIN],
    locksSlots: false,
    releasesSlots: false,
  },
] as const;

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return TERMINAL_BOOKING_STATUSES.has(status);
}

export function findBookingTransitionRule(
  from: BookingStatus,
  to: BookingStatus,
): BookingTransitionRule | undefined {
  return BOOKING_TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
}

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
  actorRole: BookingActorRole,
): boolean {
  const rule = findBookingTransitionRule(from, to);
  if (!rule) {
    return false;
  }
  return rule.allowedActors.includes(actorRole);
}

export function getAllowedNextBookingStatuses(
  from: BookingStatus,
  actorRole: BookingActorRole,
): BookingStatus[] {
  return BOOKING_TRANSITION_RULES.filter(
    (rule) => rule.from === from && rule.allowedActors.includes(actorRole),
  ).map((rule) => rule.to);
}

export const SLOT_GRANULARITY_MINUTES = 30;
export const SLOT_GRANULARITY_MS = SLOT_GRANULARITY_MINUTES * 60 * 1000;
export const MIN_BOOKING_DURATION_MINUTES = 60;
export const MAX_BOOKING_DURATION_MINUTES = 480;

export interface DiscreteTimeSlot {
  slotStartUtc: Date;
  slotEndUtc: Date;
}

/**
 * Checks whether a UTC Date is aligned to a 30-minute boundary (:00 or :30, 0s, 0ms).
 */
export function isAlignedToSlotBoundary(date: Date): boolean {
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % SLOT_GRANULARITY_MINUTES === 0
  );
}

/**
 * Decomposes a [startUtc, endUtc) window into contiguous 30-minute discrete slots
 * for atomic conflict-free reservation in `provider_slots`.
 */
export function decomposeWindowIntoSlots(
  startUtc: Date,
  endUtc: Date,
): DiscreteTimeSlot[] {
  if (!isAlignedToSlotBoundary(startUtc) || !isAlignedToSlotBoundary(endUtc)) {
    throw new Error('Booking start and end times must be aligned to 30-minute UTC boundaries.');
  }

  const durationMs = endUtc.getTime() - startUtc.getTime();
  const minMs = MIN_BOOKING_DURATION_MINUTES * 60 * 1000;
  const maxMs = MAX_BOOKING_DURATION_MINUTES * 60 * 1000;

  if (durationMs < minMs || durationMs > maxMs) {
    throw new Error(
      `Booking duration must be between ${MIN_BOOKING_DURATION_MINUTES} and ${MAX_BOOKING_DURATION_MINUTES} minutes.`,
    );
  }

  const slotCount = durationMs / SLOT_GRANULARITY_MS;
  const slots: DiscreteTimeSlot[] = [];

  for (let i = 0; i < slotCount; i += 1) {
    const slotStartMs = startUtc.getTime() + i * SLOT_GRANULARITY_MS;
    slots.push({
      slotStartUtc: new Date(slotStartMs),
      slotEndUtc: new Date(slotStartMs + SLOT_GRANULARITY_MS),
    });
  }

  return slots;
}
