import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LocalizedText, LocalizedTextSchema } from './common-subschemas';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  collection: 'categories',
  timestamps: true,
})
export class Category {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 2,
    maxlength: 64,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
  slug!: string;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  name!: LocalizedText;

  @Prop({
    type: LocalizedTextSchema,
    required: true,
  })
  description!: LocalizedText;

  @Prop({
    required: false,
    trim: true,
    maxlength: 64,
  })
  iconName?: string;

  @Prop({
    required: true,
    min: 0,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'displayOrder must be a non-negative integer',
    },
  })
  displayOrder!: number;

  @Prop({
    required: true,
    default: true,
  })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ isActive: 1, displayOrder: 1 });
