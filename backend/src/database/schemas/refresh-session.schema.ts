import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema';

export type RefreshSessionDocument = HydratedDocument<RefreshSession>;

export type RefreshRevocationReason =
  | 'ROTATED'
  | 'LOGOUT'
  | 'REPLAY_DETECTED'
  | 'ACCOUNT_SUSPENDED';

@Schema({
  collection: 'refresh_sessions',
  timestamps: true,
})
export class RefreshSession {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    maxlength: 64,
  })
  sessionId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 64,
  })
  familyId!: string;

  @Prop({
    required: true,
    select: false,
    minlength: 64,
    maxlength: 128,
  })
  secretHash!: string;

  @Prop({
    required: true,
  })
  expiresAt!: Date;

  @Prop({
    type: Date,
    required: false,
    default: null,
  })
  revokedAt!: Date | null;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  revocationReason!: RefreshRevocationReason | null;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  replacedBySessionId!: string | null;

  @Prop({
    required: false,
    trim: true,
    maxlength: 255,
  })
  userAgent?: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 64,
  })
  ipAddress?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);

RefreshSessionSchema.index({ userId: 1, revokedAt: 1 });
RefreshSessionSchema.index({ familyId: 1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
