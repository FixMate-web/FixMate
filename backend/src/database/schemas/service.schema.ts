import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CurrencyCode, isValidFilsAmount, PricingType } from '../../common/domain';
import { Category } from './category.schema';
import { LocalizedText, LocalizedTextSchema } from './common-subschemas';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ _id: false })
export class ServicePricingPolicy {
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
      message: 'indicativeAmountFils must be a non-negative integer in JOD minor units (fils)',
    },
  })
  indicativeAmountFils!: number;

  @Prop({
    type: String,
    enum: Object.values(CurrencyCode),
    default: CurrencyCode.JOD,
    required: true,
  })
  currency!: CurrencyCode;
}

export const ServicePricingPolicySchema = SchemaFactory.createForClass(ServicePricingPolicy);

@Schema({
  collection: 'services',
  timestamps: true,
})
export class Service {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ type: [String], default: [], index: true })
  discoveryCategorySlugs!: string[];

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
  slug!: string;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  title!: LocalizedText;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  description!: LocalizedText;

  @Prop({
    type: ServicePricingPolicySchema,
    required: false,
  })
  pricingPolicy?: ServicePricingPolicy;

  @Prop({
    required: true,
    min: 60,
    max: 480,
    default: 60,
    validate: {
      validator: (val: number) => Number.isInteger(val) && val % 30 === 0,
      message: 'defaultDurationMinutes must be an integer multiple of 30 between 60 and 480',
    },
  })
  defaultDurationMinutes!: number;

  @Prop({
    required: true,
    default: true,
  })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.index({ categoryId: 1, isActive: 1 });
