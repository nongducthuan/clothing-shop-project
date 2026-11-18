import {
  Controller,
  Get,
  Put,
  UseGuards,
  Req,
  Res,
  Next,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import * as notificationController from '../controllers/notificationController';

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

const run = (fn: ExpressHandler, req: Request, res: Response, next: NextFunction) => fn(req, res, next);

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  @Get()
  getNotifications(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(notificationController.getNotifications, req, res, next);
  }

  @Put(':id/read')
  markAsRead(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(notificationController.markAsRead, req, res, next);
  }

  @Put('read-all')
  markAllAsRead(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(notificationController.markAllAsRead, req, res, next);
  }
}
