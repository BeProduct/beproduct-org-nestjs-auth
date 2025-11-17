export interface BeProductUser {
  /**
   * BeProduct user ID (sub from OIDC)
   */
  id: string;

  /**
   * User email
   */
  email: string;

  /**
   * User display name/username
   */
  name: string;

  /**
   * Whether email is verified
   */
  emailVerified?: boolean;

  /**
   * User locale
   */
  locale?: string;

  /**
   * BeProduct access token
   * Use this to call BeProduct APIs on behalf of the user
   */
  accessToken?: string;

  /**
   * BeProduct refresh token
   * Use this to obtain new access tokens
   */
  refreshToken?: string;

  /**
   * Raw OIDC profile data
   */
  profile?: any;
}
