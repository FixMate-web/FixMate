import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema';

export type AddressDocument = HydratedDocument<Address>;

@Schema({
  collection: 'addresses',
  timestamps: true,
})
export class Address {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  customerId!: Types.ObjectId;

  @Prop({
    required: false,
    trim: true,
    maxlength: 60,
  })
  label?: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  })
  governorate!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  cityOrDistrict!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 160,
  })
  street!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 80,
  })
  building!: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 80,
  })
  floorOrApartment?: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 200,
  })
  landmark?: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 7,
    maxlength: 30,
  })
  contactPhone!: string;

  @Prop({
    required: true,
    default: false,
  })
  isDefault!: boolean;

  @Prop({
    required: true,
    default: true,
  })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

AddressSchema.index({ customerId: 1, isActive: 1, createdAt: -1 });
