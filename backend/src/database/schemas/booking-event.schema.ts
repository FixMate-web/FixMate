import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { BookingActorRole, BookingEventKind, BookingStatus } from '../../common/domain';
import { Booking } from './booking.schema';
import { User } from './user.schema';

export type BookingEventDocument = HydratedDocument<BookingEvent>;

@Schema({
  collection: 'booking_events',
  timestamps: false,
})
export class BookingEvent {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Booking.name,
    required: true,
  })
  bookingId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: false,
  })
  actorUserId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(BookingActorRole),
    required: true,
  })
  actorRole!: BookingActorRole;

  @Prop({
    type: String,
    enum: Object.values(BookingEventKind),
    required: true,
  })
  eventKind!: BookingEventKind;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    required: false,
  })
  fromStatus?: BookingStatus;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    required: true,
  })
  toStatus!: BookingStatus;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  reason?: string;

  @Prop({
    required: true,
    default: () => new Date(),
  })
  occurredAt!: Date;
}

export const BookingEventSchema = SchemaFactory.createForClass(BookingEvent);

BookingEventSchema.index({ bookingId: 1, occurredAt: 1 });
