import { Controller, Post, Get, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DemandsService } from './demands.service';
import { CreateDemandDto } from './dto/create-demand.dto';

@ApiTags('demands')
@Controller('demands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @Post()
  @ApiOperation({ summary: '구매 수요 등록 및 즉시 매칭 검색' })
  create(@Body() dto: CreateDemandDto, @CurrentUser() user: { id: string }) {
    return this.demandsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '내 수요 목록' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.demandsService.findByBuyer(user.id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: '수요별 매칭 매물 조회' })
  findMatches(@Param('id', ParseUUIDPipe) id: string) {
    return this.demandsService.findMatches(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '수요 취소' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.demandsService.cancel(id, user.id);
  }
}
