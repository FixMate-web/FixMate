import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Address,
  AddressSchema,
  Booking,
  BookingEvent,
  BookingEventSchema,
  BookingSchema,
  Category,
  CategorySchema,
  Notification,
  NotificationSchema,
  ProviderProfile,
  ProviderProfileSchema,
  ProviderServiceOffering,
  ProviderServiceOfferingSchema,
  ProviderSlot,
  ProviderSlotSchema,
  RefreshSession,
  RefreshSessionSchema,
  Review,
  ReviewSchema,
  Service,
  ServiceSchema,
  User,
  UserSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class UsersPersistenceModule {}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderProfile.name, schema: ProviderProfileSchema },
      { name: ProviderServiceOffering.name, schema: ProviderServiceOfferingSchema },
      { name: ProviderSlot.name, schema: ProviderSlotSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ProvidersPersistenceModule {}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CatalogPersistenceModule {}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: BookingEvent.name, schema: BookingEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BookingsPersistenceModule {}

@Module({
  imports: [MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }])],
  exports: [MongooseModule],
})
export class ReviewsPersistenceModule {}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  ],
  exports: [MongooseModule],
})
export class NotificationsPersistenceModule {}

export const DOMAIN_PERSISTENCE_MODULES = [
  UsersPersistenceModule,
  ProvidersPersistenceModule,
  CatalogPersistenceModule,
  BookingsPersistenceModule,
  ReviewsPersistenceModule,
  NotificationsPersistenceModule,
];
