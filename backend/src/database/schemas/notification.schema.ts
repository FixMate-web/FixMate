import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { NotificationResourceType, NotificationType } from '../../common/domain';
import { LocalizedText, LocalizedTextSchema } from './common-subschemas';
import { User } from './user.schema';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  collection: 'notifications',
  timestamps: true,
})
export class Notification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  recipientUserId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type!: NotificationType;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  title!: LocalizedText;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  body!: LocalizedText;

  @Prop({
    type: String,
    enum: Object.values(NotificationResourceType),
    required: true,
  })
  relatedResourceType!: NotificationResourceType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
  })
  relatedResourceId?: Types.ObjectId;

  @Prop({
    required: true,
    default: false,
  })
  isRead!: boolean;

  @Prop({
    required: false,
  })
  readAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
