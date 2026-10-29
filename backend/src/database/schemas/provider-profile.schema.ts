import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ProviderApprovalStatus } from '../../common/domain';
import { LocalizedText, LocalizedTextSchema } from './common-subschemas';
import { User } from './user.schema';

export type ProviderProfileDocument = HydratedDocument<ProviderProfile>;

@Schema({ _id: false })
export class AvailabilityWindow {
  @Prop({
    required: true,
    min: 0,
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)',
    },
  })
  dayOfWeek!: number;

  @Prop({
    required: true,
    min: 0,
    max: 1410,
    validate: {
      validator: (val: number) => Number.isInteger(val) && val % 30 === 0,
      message: 'startMinuteOfDay must be an integer multiple of 30',
    },
  })
  startMinuteOfDay!: number;

  @Prop({
    required: true,
    min: 30,
    max: 1440,
    validate: {
      validator: (val: number) => Number.isInteger(val) && val % 30 === 0,
      message: 'endMinuteOfDay must be an integer multiple of 30',
    },
  })
  endMinuteOfDay!: number;
}

export const AvailabilityWindowSchema = SchemaFactory.createForClass(AvailabilityWindow);

@Schema({ _id: false })
export class ProviderApprovalMetadata {
  @Prop({ required: false })
  submittedAt?: Date;

  @Prop({ required: false })
  reviewedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: false })
  reviewedByUserId?: Types.ObjectId;

  @Prop({ required: false, trim: true, maxlength: 500 })
  rejectionOrSuspensionReason?: string;

  @Prop({ required: false, trim: true, maxlength: 1000, select: false })
  verificationNotes?: string;
}

export const ProviderApprovalMetadataSchema =
  SchemaFactory.createForClass(ProviderApprovalMetadata);

@Schema({
  collection: 'provider_profiles',
  timestamps: true,
})
export class ProviderProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120,
  })
  displayName!: string;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  bio!: LocalizedText;

  @Prop({
    required: true,
    min: 0,
    max: 60,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'yearsOfExperience must be a non-negative integer',
    },
  })
  yearsOfExperience!: number;

  @Prop({
    type: [String],
    default: [],
  })
  coverageGovernorates!: string[];

  @Prop({
    type: [String],
    default: [],
  })
  coverageAreas!: string[];

  @Prop({
    type: [AvailabilityWindowSchema],
    default: [],
  })
  weeklyAvailability!: AvailabilityWindow[];

  @Prop({
    type: String,
    enum: Object.values(ProviderApprovalStatus),
    default: ProviderApprovalStatus.DRAFT,
    required: true,
  })
  approvalStatus!: ProviderApprovalStatus;

  @Prop({
    type: ProviderApprovalMetadataSchema,
    default: () => ({}),
  })
  approvalMetadata!: ProviderApprovalMetadata;

  @Prop({
    required: true,
    min: 0,
    max: 5,
    default: 0,
  })
  averageRating!: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'reviewCount must be a non-negative integer',
    },
  })
  reviewCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProviderProfileSchema = SchemaFactory.createForClass(ProviderProfile);

ProviderProfileSchema.index({ approvalStatus: 1, coverageGovernorates: 1 });
