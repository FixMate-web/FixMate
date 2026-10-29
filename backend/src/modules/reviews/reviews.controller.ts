import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../common/auth';
import { UserRole } from '../../common/domain';
import {
  CreateReviewDto,
  ModerateReviewVisibilityDto,
  QueryReviewsDto,
} from './reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  submitBookingReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.submitBookingReview(user, bookingId, dto);
  }

  @Get('providers/:id/reviews')
  listPublicProviderReviews(
    @Param('id') providerProfileId: string,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.listPublicProviderReviews(
      providerProfileId,
      query,
    );
  }

  @Get('reviews/me')
  @UseGuards(JwtAuthGuard)
  listMyReviews(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.listMyReviews(user);
  }

  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listReviewsForAdmin(@Query() query: QueryReviewsDto) {
    return this.reviewsService.listReviewsForAdmin(query);
  }

  @Patch('admin/reviews/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  moderateReviewVisibility(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id') reviewId: string,
    @Body() dto: ModerateReviewVisibilityDto,
  ) {
    return this.reviewsService.moderateReviewVisibility(
      adminUser,
      reviewId,
      dto,
    );
  }
}
