import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import { BeProductAuthOptions } from '../interfaces/beproduct-auth-options.interface';
import { BeProductUser } from '../interfaces/beproduct-user.interface';
import { BEPRODUCT_AUTH_OPTIONS } from '../constants';

@Injectable()
export class BeProductOidcStrategy extends PassportStrategy(
  OpenIDConnectStrategy,
  'beproduct-oidc',
) {
  constructor(
    @Inject(BEPRODUCT_AUTH_OPTIONS)
    private options: BeProductAuthOptions,
  ) {
    super({
      issuer: options.issuer,
      authorizationURL: options.authorizationURL,
      tokenURL: options.tokenURL,
      userInfoURL: options.userInfoURL,
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: options.scope || ['openid', 'profile', 'email'],
      skipUserProfile: false,
      passReqToCallback: false,
    });

    // Override the _verify function to capture tokens
    (this as any)._verify = async (
      issuer: string,
      profile: any,
      context: any,
      idToken: string,
      accessToken: string,
      refreshToken: string,
      done: (error: any, user?: any) => void,
    ) => {
      try {
        let user: BeProductUser;

        if (options.validateUser) {
          // Use custom validation function
          user = await options.validateUser(profile, accessToken, refreshToken);
        } else {
          // Default transformation
          const email = profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;

          if (!email) {
            return done(new Error('No email found in BeProduct profile'));
          }

          user = {
            id: profile.id,
            email: email,
            name: profile.username || profile.displayName || email.split('@')[0],
            emailVerified: true,
            locale: 'en',
            accessToken: accessToken || '',
            refreshToken: refreshToken || '',
            profile: profile,
          };
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    };
  }

  async validate(profile: any): Promise<any> {
    return profile;
  }
}
