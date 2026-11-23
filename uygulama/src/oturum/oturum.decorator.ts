import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Kullanici = createParamDecorator((_veri: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().kullanici);

export const Token = createParamDecorator((_veri: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().token);
