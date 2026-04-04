import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MetricsBearerGuard } from '../core/guards/metrics-bearer.guard';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(MetricsBearerGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics exposition' })
  @ApiOkResponse({ description: 'Prometheus metrics text' })
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
} 