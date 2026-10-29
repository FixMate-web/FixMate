import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import {
  NotificationResourceType,
  NotificationType,
} from '../../common/domain';
import { Notification, NotificationDocument } from '../../database/schemas';
import { QueryNotificationsDto } from './notifications.dto';

export interface NotificationView {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  relatedResourceType: NotificationResourceType;
  relatedResourceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface CreateNotificationInput {
  recipientUserId: Types.ObjectId | string;
  type: NotificationType;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  relatedResourceType: NotificationResourceType;
  relatedResourceId?: Types.ObjectId | string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<NotificationView> {
    const recipientObjectId =
      typeof input.recipientUserId === 'string'
        ? new Types.ObjectId(input.recipientUserId)
        : input.recipientUserId;

    const resourceObjectId = input.relatedResourceId
      ? typeof input.relatedResourceId === 'string'
        ? new Types.ObjectId(input.relatedResourceId)
        : input.relatedResourceId
      : undefined;

    const doc = await this.notificationModel.create({
      recipientUserId: recipientObjectId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedResourceType: input.relatedResourceType,
      relatedResourceId: resourceObjectId,
      isRead: false,
    });

    // Safe local-stub email notification log (no real external emails sent in local/test mode)
    this.logger.log(
      `[EmailStub] Queued local notification stub type=${input.type} recipient=${recipientObjectId.toString()} subject="${input.title.en}"`,
    );

    return this.toView(doc);
  }

  async listMyNotifications(
    user: AuthenticatedUser,
    query: QueryNotificationsDto,
  ): Promise<{
    items: NotificationView[];
    unreadCount: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const recipientUserId = new Types.ObjectId(user.id);

    const filter: FilterQuery<NotificationDocument> = {
      recipientUserId,
    };
    if (query.unreadOnly) {
      filter.isRead = false;
    }

    const [docs, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel
        .countDocuments({ recipientUserId, isRead: false })
        .exec(),
    ]);

    return {
      items: docs.map((d) => this.toView(d)),
      unreadCount,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async markAsRead(user: AuthenticatedUser, id: string): Promise<NotificationView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification id.');
    }

    const doc = await this.notificationModel
      .findOne({
        _id: new Types.ObjectId(id),
        recipientUserId: new Types.ObjectId(user.id),
      })
      .exec();

    if (!doc) {
      throw new NotFoundException('Notification not found.');
    }

    if (!doc.isRead) {
      doc.isRead = true;
      doc.readAt = new Date();
      await doc.save();
    }

    return this.toView(doc);
  }

  async markAllAsRead(user: AuthenticatedUser): Promise<{ updatedCount: number }> {
    const now = new Date();
    const res = await this.notificationModel
      .updateMany(
        {
          recipientUserId: new Types.ObjectId(user.id),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: now,
          },
        },
      )
      .exec();

    return { updatedCount: res.modifiedCount };
  }

  private toView(doc: NotificationDocument): NotificationView {
    return {
      id: doc._id.toString(),
      recipientUserId: doc.recipientUserId.toString(),
      type: doc.type,
      title: { ar: doc.title.ar, en: doc.title.en },
      body: { ar: doc.body.ar, en: doc.body.en },
      relatedResourceType: doc.relatedResourceType,
      relatedResourceId: doc.relatedResourceId?.toString(),
      isRead: doc.isRead,
      readAt: doc.readAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString(),
    };
  }
}
