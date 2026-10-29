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
  AcceptBookingDto,
  CancelBookingDto,
  CompleteBookingDto,
  CreateBookingDto,
  MarkWorkDoneDto,
  QueryBookingsDto,
  RejectBookingDto,
  StartBookingDto,
} from './bookings.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user, dto);
  }

  @Get()
  listBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.listBookings(user, query);
  }

  @Get(':id')
  getBookingById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.getBookingById(user, id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.PROVIDER)
  acceptBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AcceptBookingDto,
  ) {
    return this.bookingsService.acceptBooking(user, id, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.PROVIDER)
  rejectBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectBooking(user, id, dto);
  }

  @Patch(':id/start')
  @Roles(UserRole.PROVIDER)
  startBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StartBookingDto,
  ) {
    return this.bookingsService.startBooking(user, id, dto);
  }

  @Patch(':id/work-done')
  @Roles(UserRole.PROVIDER)
  markWorkDone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkWorkDoneDto,
  ) {
    return this.bookingsService.markWorkDone(user, id, dto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  completeBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteBookingDto,
  ) {
    return this.bookingsService.completeBooking(user, id, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN)
  cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user, id, dto);
  }
}
