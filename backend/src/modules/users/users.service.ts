import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccountStatus, SupportedLanguage, UserRole } from '../../common/domain';
import { User, UserDocument } from '../../database/schemas';
import { UpdateMeDto } from './dto/update-me.dto';

export interface SanitizedUserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  preferredLanguage: SupportedLanguage;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  toSanitizedProfile(user: UserDocument | (User & { _id: Types.ObjectId })): SanitizedUserProfile {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : undefined,
    };
  }

  async getMyProfile(actorUserId: string): Promise<SanitizedUserProfile> {
    if (!Types.ObjectId.isValid(actorUserId)) {
      throw new NotFoundException('User account not found.');
    }

    const user = await this.userModel
      .findById(actorUserId)
      .select('_id fullName email phone role status preferredLanguage createdAt updatedAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    return this.toSanitizedProfile(user as User & { _id: Types.ObjectId });
  }

  async updateMyProfile(
    actorUserId: string,
    dto: UpdateMeDto,
  ): Promise<SanitizedUserProfile> {
    if (!Types.ObjectId.isValid(actorUserId)) {
      throw new NotFoundException('User account not found.');
    }

    // Strict allowlist construction — never permits role, status, email, or passwordHash mutations
    const allowedUpdate: Partial<Pick<User, 'fullName' | 'phone' | 'preferredLanguage'>> = {};
    if (typeof dto.fullName === 'string') {
      allowedUpdate.fullName = dto.fullName.trim();
    }
    if (typeof dto.phone === 'string') {
      allowedUpdate.phone = dto.phone.trim();
    }
    if (dto.preferredLanguage !== undefined) {
      allowedUpdate.preferredLanguage = dto.preferredLanguage;
    }

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(actorUserId) },
        { $set: allowedUpdate },
        { new: true, runValidators: true },
      )
      .select('_id fullName email phone role status preferredLanguage createdAt updatedAt')
      .lean();

    if (!updated) {
      throw new NotFoundException('User account not found.');
    }

    return this.toSanitizedProfile(updated as User & { _id: Types.ObjectId });
  }
}
