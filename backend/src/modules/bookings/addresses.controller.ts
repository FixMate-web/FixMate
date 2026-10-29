import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
} from '../../common/auth';
import { CreateAddressDto, UpdateAddressDto } from './bookings.dto';
import { BookingsService } from './bookings.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  listMyAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.listMyAddresses(user);
  }

  @Post()
  createMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.bookingsService.createMyAddress(user, dto);
  }

  @Patch(':id')
  updateMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.bookingsService.updateMyAddress(user, id, dto);
  }

  @Delete(':id')
  deleteMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.deleteMyAddress(user, id);
  }
}
