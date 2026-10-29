import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../../common/auth';
import { UserRole } from '../../common/domain';
import { CatalogService } from './catalog.service';
import {
  CreateCategoryDto,
  CreateServiceDto,
  QueryServicesDto,
  UpdateCategoryDto,
  UpdateServiceDto,
} from './dto/catalog.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  async listPublicCategories() {
    return this.catalogService.listActiveCategories();
  }

  @Get('categories/:slug')
  async getPublicCategoryBySlug(@Param('slug') slug: string) {
    return this.catalogService.getActiveCategoryBySlug(slug);
  }

  @Get('services')
  async listPublicServices(@Query() query: QueryServicesDto) {
    return this.catalogService.listActiveServices(query);
  }

  @Get('services/:slug')
  async getPublicServiceBySlug(@Param('slug') slug: string) {
    return this.catalogService.getActiveServiceBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/categories')
  async listAdminCategories() {
    return this.catalogService.listCategoriesAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(['categories', 'admin/categories'])
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(['categories/:id', 'admin/categories/:id'])
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/services')
  async listAdminServices() {
    return this.catalogService.listServicesAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(['services', 'admin/services'])
  @HttpCode(HttpStatus.CREATED)
  async createService(@Body() dto: CreateServiceDto) {
    return this.catalogService.createService(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(['services/:id', 'admin/services/:id'])
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.catalogService.updateService(id, dto);
  }
}
