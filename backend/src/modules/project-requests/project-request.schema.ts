import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongoSchema } from 'mongoose';
import { LocalizedText, LocalizedTextSchema } from '../../database/schemas/common-subschemas';
export type ProjectRequestDocument = HydratedDocument<ProjectRequest>;
export const REQUEST_STATUSES = ['OPEN', 'RESPONDED', 'DECLINED', 'CANCELLED'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
@Schema({ collection: 'project_requests', timestamps: true })
export class ProjectRequest {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  customerId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  providerUserId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true }) providerProfileId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true }) serviceId!: Types.ObjectId;
  @Prop({ required: true }) clientRequestId!: string;
  @Prop({ required: true }) customerName!: string;
  @Prop({ required: true }) providerName!: string;
  @Prop({ type: LocalizedTextSchema, required: true }) serviceTitle!: LocalizedText;
  @Prop({ required: true, maxlength: 80 }) governorate!: string;
  @Prop({ required: true, maxlength: 80 }) area!: string;
  @Prop({ required: true, maxlength: 2000 }) description!: string;
  @Prop({ type: String, enum: REQUEST_STATUSES, default: 'OPEN' }) status!: RequestStatus;
  @Prop({ maxlength: 1000 }) providerResponse?: string;
  @Prop() respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export const ProjectRequestSchema = SchemaFactory.createForClass(ProjectRequest);
ProjectRequestSchema.index({ customerId: 1, clientRequestId: 1 }, { unique: true });
ProjectRequestSchema.index({ providerUserId: 1, createdAt: -1 });
