import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  BookingActorRole,
  BookingStatus,
  CurrencyCode,
  isValidFilsAmount,
  PricingType,
} from '../../common/domain';
import { ProviderProfile } from './provider-profile.schema';
import { Service } from './service.schema';
import { User } from './user.schema';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ _id: false })
export class BookingServiceSnapshot {
  @Prop({ required: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  titleAr!: string;

  @Prop({ required: true, trim: true })
  titleEn!: string;

  @Prop({ required: true, trim: true })
  categorySlug!: string;
}

export const BookingServiceSnapshotSchema =
  SchemaFactory.createForClass(BookingServiceSnapshot);

@Schema({ _id: false })
export class BookingAddressSnapshot {
  @Prop({ required: false, trim: true })
  label?: string;

  @Prop({ required: true, trim: true })
  governorate!: string;

  @Prop({ required: true, trim: true })
  cityOrDistrict!: string;

  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true })
  building!: string;

  @Prop({ required: false, trim: true })
  floorOrApartment?: string;

  @Prop({ required: false, trim: true })
  landmark?: string;

  @Prop({ required: true, trim: true })
  contactPhone!: string;
}

export const BookingAddressSnapshotSchema =
  SchemaFactory.createForClass(BookingAddressSnapshot);

@Schema({ _id: false })
export class BookingPricingSnapshot {
  @Prop({
    type: String,
    enum: Object.values(PricingType),
    required: true,
  })
  pricingType!: PricingType;

  @Prop({
    required: true,
    min: 0,
    validate: {
      validator: isValidFilsAmount,
      message: 'quotedAmountFils must be a non-negative integer in JOD minor units (fils)',
    },
  })
  quotedAmountFils!: number;

  @Prop({
    required: false,
    min: 0,
    validate: {
      validator: (val: unknown) => val === undefined || val === null || isValidFilsAmount(val),
      message: 'agreedAmountFils must be a non-negative integer in JOD minor units (fils)',
    },
  })
  agreedAmountFils?: number;

  @Prop({
    type: String,
    enum: Object.values(CurrencyCode),
    default: CurrencyCode.JOD,
    required: true,
  })
  currency!: CurrencyCode;
}

export const BookingPricingSnapshotSchema =
  SchemaFactory.createForClass(BookingPricingSnapshot);

@Schema({
  collection: 'bookings',
  timestamps: true,
})
export class Booking {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  customerId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: ProviderProfile.name,
    required: true,
  })
  providerProfileId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Service.name,
    required: true,
  })
  serviceId!: Types.ObjectId;

  @Prop({
    type: BookingServiceSnapshotSchema,
    required: true,
  })
  serviceSnapshot!: BookingServiceSnapshot;

  @Prop({
    type: BookingAddressSnapshotSchema,
    required: true,
  })
  addressSnapshot!: BookingAddressSnapshot;

  @Prop({
    type: BookingPricingSnapshotSchema,
    required: true,
  })
  pricingSnapshot!: BookingPricingSnapshot;

  @Prop({ required: true })
  requestedStartUtc!: Date;

  @Prop({ required: true })
  requestedEndUtc!: Date;

  @Prop({ required: false })
  confirmedStartUtc?: Date;

  @Prop({ required: false })
  confirmedEndUtc?: Date;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.REQUESTED,
    required: true,
  })
  status!: BookingStatus;

  @Prop({ required: false, trim: true, maxlength: 1000 })
  customerNotes?: string;

  @Prop({ required: false, trim: true, maxlength: 1000 })
  providerNotes?: string;

  @Prop({ required: false, trim: true, maxlength: 500 })
  rejectionReason?: string;

  @Prop({ required: false, trim: true, maxlength: 500 })
  cancellationReason?: string;

  @Prop({
    type: String,
    enum: Object.values(BookingActorRole),
    required: false,
  })
  cancelledByRole?: BookingActorRole;

  @Prop({ required: false })
  acceptedAt?: Date;

  @Prop({ required: false })
  startedAt?: Date;

  @Prop({ required: false })
  workDoneAt?: Date;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ required: false })
  rejectedAt?: Date;

  @Prop({ required: false })
  cancelledAt?: Date;

  @Prop({ required: false })
  expiredAt?: Date;

  @Prop({ required: false, trim: true, maxlength: 80 })
  clientRequestId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ providerProfileId: 1, status: 1, requestedStartUtc: 1 });
BookingSchema.index(
  { customerId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientRequestId: { $type: 'string' } },
  },
);
