import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { isAlignedToSlotBoundary } from '../../common/domain';
import { Booking } from './booking.schema';
import { ProviderProfile } from './provider-profile.schema';

export type ProviderSlotDocument = HydratedDocument<ProviderSlot>;

/**
 * Represents a locked 30-minute capacity bucket for an ACCEPTED or IN_PROGRESS booking.
 * Enforces conflict-free reservation via a unique compound index on { providerProfileId, slotStartUtc }.
 */
@Schema({
  collection: 'provider_slots',
  timestamps: true,
})
export class ProviderSlot {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: ProviderProfile.name,
    required: true,
  })
  providerProfileId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Booking.name,
    required: true,
  })
  bookingId!: Types.ObjectId;

  @Prop({
    required: true,
    validate: {
      validator: (val: Date) => val instanceof Date && isAlignedToSlotBoundary(val),
      message: 'slotStartUtc must be aligned to a 30-minute UTC boundary (:00 or :30)',
    },
  })
  slotStartUtc!: Date;

  @Prop({
    required: true,
    validate: {
      validator: (val: Date) => val instanceof Date && isAlignedToSlotBoundary(val),
      message: 'slotEndUtc must be aligned to a 30-minute UTC boundary (:00 or :30)',
    },
  })
  slotEndUtc!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProviderSlotSchema = SchemaFactory.createForClass(ProviderSlot);

ProviderSlotSchema.index({ providerProfileId: 1, slotStartUtc: 1 }, { unique: true });
ProviderSlotSchema.index({ bookingId: 1 });
