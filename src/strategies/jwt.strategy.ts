import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { BeProductAuthOptions } from '../interfaces/beproduct-auth-options.interface';
import { BEPRODUCT_AUTH_OPTIONS } from '../constants';

@Injectable()
export class BeProductJwtStrategy extends PassportStrategy(Strategy, 'beproduct-jwt') {
  constructor(
    @Inject(BEPRODUCT_AUTH_OPTIONS)
    private options: BeProductAuthOptions,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie first
        (request: Request) => {
          const token = request?.cookies?.['authToken'];
          if (!token) return null;
          return token;
        },
        // Fallback to Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: options.jwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Return user from JWT payload
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      ...payload,
    };
  }
}
