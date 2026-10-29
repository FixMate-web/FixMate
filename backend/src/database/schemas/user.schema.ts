import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AccountStatus, SupportedLanguage, UserRole } from '../../common/domain';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120,
  })
  fullName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
    minlength: 10,
    maxlength: 255,
  })
  passwordHash!: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 30,
  })
  phone?: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
    required: true,
  })
  role!: UserRole;

  @Prop({
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE,
    required: true,
  })
  status!: AccountStatus;

  @Prop({
    type: String,
    enum: Object.values(SupportedLanguage),
    default: SupportedLanguage.AR,
    required: true,
  })
  preferredLanguage!: SupportedLanguage;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, status: 1 });
