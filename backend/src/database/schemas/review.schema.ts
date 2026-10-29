import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ReviewModerationStatus } from '../../common/domain';
import { Booking } from './booking.schema';
import { ProviderProfile } from './provider-profile.schema';
import { User } from './user.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  collection: 'reviews',
  timestamps: true,
})
export class Review {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Booking.name,
    required: true,
    unique: true,
  })
  bookingId!: Types.ObjectId;

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
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'rating must be an integer between 1 and 5',
    },
  })
  rating!: number;

  @Prop({
    required: false,
    trim: true,
    maxlength: 1000,
  })
  comment?: string;

  @Prop({
    type: String,
    enum: Object.values(ReviewModerationStatus),
    default: ReviewModerationStatus.VISIBLE,
    required: true,
  })
  moderationStatus!: ReviewModerationStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: false,
  })
  moderatedByUserId?: Types.ObjectId;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  moderationReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ providerProfileId: 1, moderationStatus: 1, createdAt: -1 });
