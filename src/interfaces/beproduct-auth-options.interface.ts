import { ModuleMetadata, Type } from '@nestjs/common';

export interface BeProductAuthOptions {
  /**
   * BeProduct OIDC issuer URL
   * @example 'https://id.winks.io/ids'
   */
  issuer: string;

  /**
   * BeProduct OIDC authorization URL
   * @example 'https://id.winks.io/ids/connect/authorize'
   */
  authorizationURL: string;

  /**
   * BeProduct OIDC token URL
   * @example 'https://id.winks.io/ids/connect/token'
   */
  tokenURL: string;

  /**
   * BeProduct OIDC userinfo URL
   * @example 'https://id.winks.io/ids/connect/userinfo'
   */
  userInfoURL: string;

  /**
   * OAuth client ID
   */
  clientID: string;

  /**
   * OAuth client secret
   */
  clientSecret: string;

  /**
   * OAuth callback URL
   * @example 'http://localhost:3000/api/auth/callback/beproduct'
   */
  callbackURL: string;

  /**
   * OAuth scopes
   * @default ['openid', 'profile', 'email']
   */
  scope?: string[];

  /**
   * JWT secret for signing tokens
   */
  jwtSecret: string;

  /**
   * JWT expiration time
   * @default '30d'
   */
  jwtExpiration?: string;

  /**
   * Custom user validation function
   * Called after OIDC authentication with profile and tokens
   */
  validateUser?: (profile: any, accessToken: string, refreshToken: string) => Promise<any>;
}

export interface BeProductAuthOptionsFactory {
  createBeProductAuthOptions(): Promise<BeProductAuthOptions> | BeProductAuthOptions;
}

export interface BeProductAuthAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<BeProductAuthOptionsFactory>;
  useClass?: Type<BeProductAuthOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<BeProductAuthOptions> | BeProductAuthOptions;
  inject?: any[];
}
