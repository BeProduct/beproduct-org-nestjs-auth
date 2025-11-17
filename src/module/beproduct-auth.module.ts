import { DynamicModule, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  BeProductAuthOptions,
  BeProductAuthAsyncOptions,
  BeProductAuthOptionsFactory,
} from '../interfaces/beproduct-auth-options.interface';
import { BeProductOidcStrategy } from '../strategies/beproduct-oidc.strategy';
import { BeProductJwtStrategy } from '../strategies/jwt.strategy';
import { BEPRODUCT_AUTH_OPTIONS } from '../constants';

@Module({})
export class BeProductAuthModule {
  /**
   * Register BeProduct authentication module with static configuration
   *
   * @example
   * ```typescript
   * BeProductAuthModule.forRoot({
   *   issuer: 'https://id.winks.io/ids',
   *   authorizationURL: 'https://id.winks.io/ids/connect/authorize',
   *   tokenURL: 'https://id.winks.io/ids/connect/token',
   *   userInfoURL: 'https://id.winks.io/ids/connect/userinfo',
   *   clientID: process.env.OIDC_CLIENT_ID!,
   *   clientSecret: process.env.OIDC_CLIENT_SECRET!,
   *   callbackURL: 'http://localhost:3000/api/auth/callback/beproduct',
   *   scope: ['openid', 'profile', 'email', 'BeProductPublicApi'],
   *   jwtSecret: process.env.JWT_SECRET!,
   *   jwtExpiration: '30d',
   * })
   * ```
   */
  static forRoot(options: BeProductAuthOptions): DynamicModule {
    return {
      module: BeProductAuthModule,
      imports: [
        PassportModule,
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: {
            expiresIn: options.jwtExpiration || '30d',
          } as any,
        }),
      ],
      providers: [
        {
          provide: BEPRODUCT_AUTH_OPTIONS,
          useValue: options,
        },
        BeProductOidcStrategy,
        BeProductJwtStrategy,
      ],
      exports: [JwtModule, BEPRODUCT_AUTH_OPTIONS],
    };
  }

  /**
   * Register BeProduct authentication module with async configuration
   *
   * @example
   * ```typescript
   * BeProductAuthModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: (configService: ConfigService) => ({
   *     issuer: configService.get('OIDC_ISSUER'),
   *     authorizationURL: configService.get('OIDC_AUTHORIZATION_URL'),
   *     tokenURL: configService.get('OIDC_TOKEN_URL'),
   *     userInfoURL: configService.get('OIDC_USERINFO_URL'),
   *     clientID: configService.get('OIDC_CLIENT_ID'),
   *     clientSecret: configService.get('OIDC_CLIENT_SECRET'),
   *     callbackURL: configService.get('OIDC_CALLBACK_URL'),
   *     scope: configService.get('OIDC_SCOPES').split(' '),
   *     jwtSecret: configService.get('JWT_SECRET'),
   *     jwtExpiration: configService.get('JWT_EXPIRATION'),
   *   }),
   *   inject: [ConfigService],
   * })
   * ```
   */
  static forRootAsync(options: BeProductAuthAsyncOptions): DynamicModule {
    return {
      module: BeProductAuthModule,
      imports: [
        PassportModule,
        JwtModule.registerAsync({
          imports: options.imports || [],
          useFactory: options.useFactory
            ? async (...args: any[]) => {
                const config = await options.useFactory!(...args);
                return {
                  secret: config.jwtSecret,
                  signOptions: {
                    expiresIn: config.jwtExpiration || '30d',
                  } as any,
                };
              }
            : async (optionsFactory: BeProductAuthOptionsFactory) => {
                const config = await optionsFactory.createBeProductAuthOptions();
                return {
                  secret: config.jwtSecret,
                  signOptions: {
                    expiresIn: config.jwtExpiration || '30d',
                  } as any,
                };
              },
          inject: options.inject || [],
        }),
        ...(options.imports || []),
      ],
      providers: [
        ...this.createAsyncProviders(options),
        BeProductOidcStrategy,
        BeProductJwtStrategy,
      ],
      exports: [JwtModule, BEPRODUCT_AUTH_OPTIONS],
    };
  }

  private static createAsyncProviders(
    options: BeProductAuthAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: BEPRODUCT_AUTH_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    const inject = [
      (options.useClass || options.useExisting) as any,
    ];

    return [
      {
        provide: BEPRODUCT_AUTH_OPTIONS,
        useFactory: async (optionsFactory: BeProductAuthOptionsFactory) =>
          await optionsFactory.createBeProductAuthOptions(),
        inject,
      },
      ...(options.useClass
        ? [
            {
              provide: options.useClass,
              useClass: options.useClass,
            },
          ]
        : []),
    ];
  }
}
