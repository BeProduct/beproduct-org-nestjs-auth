import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get the current authenticated user from the request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(AuthGuard('beproduct-jwt'))
 * getProfile(@CurrentUser() user: BeProductUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
