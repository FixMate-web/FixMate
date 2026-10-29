import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LocalizedText {
  @Prop({ required: true, trim: true, minlength: 1, maxlength: 2000 })
  ar!: string;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 2000 })
  en!: string;
}

export const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedText);
