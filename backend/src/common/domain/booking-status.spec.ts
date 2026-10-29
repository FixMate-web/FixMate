import {
  BookingActorRole,
  BookingStatus,
  canTransitionBookingStatus,
  decomposeWindowIntoSlots,
  getAllowedNextBookingStatuses,
  isAlignedToSlotBoundary,
  isTerminalBookingStatus,
  isValidFilsAmount,
} from './index';

describe('BookingStatus State Machine & Slot Decomposition', () => {
  it('enforces valid transitions by actor role according to BOOKING_LIFECYCLE.md', () => {
    expect(
      canTransitionBookingStatus(
        BookingStatus.REQUESTED,
        BookingStatus.ACCEPTED,
        BookingActorRole.PROVIDER,
      ),
    ).toBe(true);

    expect(
      canTransitionBookingStatus(
        BookingStatus.REQUESTED,
        BookingStatus.ACCEPTED,
        BookingActorRole.CUSTOMER,
      ),
    ).toBe(false);

    expect(
      canTransitionBookingStatus(
        BookingStatus.ACCEPTED,
        BookingStatus.IN_PROGRESS,
        BookingActorRole.PROVIDER,
      ),
    ).toBe(true);

    expect(
      canTransitionBookingStatus(
        BookingStatus.IN_PROGRESS,
        BookingStatus.WORK_DONE,
        BookingActorRole.PROVIDER,
      ),
    ).toBe(true);

    expect(
      canTransitionBookingStatus(
        BookingStatus.WORK_DONE,
        BookingStatus.COMPLETED,
        BookingActorRole.CUSTOMER,
      ),
    ).toBe(true);

    // Provider cannot unilaterally mark WORK_DONE -> COMPLETED
    expect(
      canTransitionBookingStatus(
        BookingStatus.WORK_DONE,
        BookingStatus.COMPLETED,
        BookingActorRole.PROVIDER,
      ),
    ).toBe(false);
  });

  it('prevents customer or provider self-cancellation once IN_PROGRESS, allowing only ADMIN', () => {
    expect(
      canTransitionBookingStatus(
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingActorRole.CUSTOMER,
      ),
    ).toBe(false);

    expect(
      canTransitionBookingStatus(
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingActorRole.PROVIDER,
      ),
    ).toBe(false);

    expect(
      canTransitionBookingStatus(
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingActorRole.ADMIN,
      ),
    ).toBe(true);
  });

  it('identifies terminal statuses accurately and returns no outgoing transitions', () => {
    expect(isTerminalBookingStatus(BookingStatus.COMPLETED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.CANCELLED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.REJECTED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.EXPIRED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.REQUESTED)).toBe(false);

    expect(
      getAllowedNextBookingStatuses(BookingStatus.COMPLETED, BookingActorRole.ADMIN),
    ).toEqual([]);
  });

  it('decomposes valid UTC windows into contiguous 30-minute discrete slots', () => {
    const start = new Date('2026-11-01T10:00:00.000Z');
    const end = new Date('2026-11-01T11:30:00.000Z');

    expect(isAlignedToSlotBoundary(start)).toBe(true);
    const slots = decomposeWindowIntoSlots(start, end);

    expect(slots).toHaveLength(3);
    expect(slots[0].slotStartUtc.toISOString()).toBe('2026-11-01T10:00:00.000Z');
    expect(slots[0].slotEndUtc.toISOString()).toBe('2026-11-01T10:30:00.000Z');
    expect(slots[2].slotStartUtc.toISOString()).toBe('2026-11-01T11:00:00.000Z');
    expect(slots[2].slotEndUtc.toISOString()).toBe('2026-11-01T11:30:00.000Z');
  });

  it('rejects unaligned slot boundaries and floating-point currency amounts', () => {
    const unalignedStart = new Date('2026-11-01T10:15:00.000Z');
    const end = new Date('2026-11-01T11:30:00.000Z');
    expect(() => decomposeWindowIntoSlots(unalignedStart, end)).toThrow(/30-minute/);

    expect(isValidFilsAmount(15000)).toBe(true);
    expect(isValidFilsAmount(0)).toBe(true);
    expect(isValidFilsAmount(15.5)).toBe(false);
    expect(isValidFilsAmount(-100)).toBe(false);
  });
});
