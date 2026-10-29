import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CurrencyCode, isValidFilsAmount, PricingType } from '../../common/domain';
import { ProviderProfile } from './provider-profile.schema';
import { Service } from './service.schema';

export type ProviderServiceOfferingDocument = HydratedDocument<ProviderServiceOffering>;

@Schema({
  collection: 'provider_services',
  timestamps: true,
})
export class ProviderServiceOffering {
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
      message: 'priceAmountFils must be a non-negative integer in JOD minor units (fils)',
    },
  })
  priceAmountFils!: number;

  @Prop({
    type: String,
    enum: Object.values(CurrencyCode),
    default: CurrencyCode.JOD,
    required: true,
  })
  currency!: CurrencyCode;

  @Prop({
    required: true,
    min: 60,
    max: 480,
    default: 60,
    validate: {
      validator: (val: number) => Number.isInteger(val) && val % 30 === 0,
      message: 'estimatedDurationMinutes must be an integer multiple of 30 between 60 and 480',
    },
  })
  estimatedDurationMinutes!: number;

  @Prop({
    required: true,
    default: true,
  })
  isEnabled!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProviderServiceOfferingSchema =
  SchemaFactory.createForClass(ProviderServiceOffering);

ProviderServiceOfferingSchema.index({ providerProfileId: 1, serviceId: 1 }, { unique: true });
ProviderServiceOfferingSchema.index({ serviceId: 1, isEnabled: 1 });
