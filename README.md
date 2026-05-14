# @beproduct/nestjs-auth

> [!CAUTION]
> **Security advisory — versions 0.1.2 through 0.1.19 are malicious.** Between 2026-05-11 20:19 UTC and 22:56 UTC, an attacker used a compromised npm publish token to publish 18 poisoned versions of this package containing the **Mini Shai-Hulud** worm payload. The poisoned versions were removed from the npm registry by npm Security shortly after. Version **`0.1.20`** is a clean republish from the same source tree as `0.1.1`.
>
> **If you installed any version in the range `>=0.1.2 <=0.1.19`**, the postinstall script attempted to steal:
> - npm tokens (`~/.npmrc`)
> - GitHub PATs and OAuth tokens
> - GitHub Actions OIDC tokens
> - AWS credentials (env vars and `~/.aws/credentials`)
> - HashiCorp Vault tokens
>
> **Required mitigation:**
> 1. Remove the package: `npm uninstall @beproduct/nestjs-auth && npm cache clean --force`
> 2. Install the clean version: `npm install @beproduct/nestjs-auth@0.1.20`
> 3. **Rotate every credential present in the install environment** at the time of install: npm tokens, GitHub tokens, AWS keys, Vault tokens.
> 4. Scan for indicators of compromise:
>    - File names: `tanstack_runner.js`, `router_init.js`, `router_runtime.js`
>    - SHA-256: `2ec78d556d696e208927cc503d48e4b5eb56b31abc2870c2ed2e98d6be27fc96` (tanstack_runner.js)
>    - SHA-256: `ab4fcadaec49c03278063dd269ea5eef82d24f2124a8e15d7b90f2fa8601266c` (router_init.js)
>    - Network egress to `filev2.getsession.org`
>    - Suspicious additions in `.claude/` and `.vscode/` directories (especially `setup.mjs` + `tasks.json` with `runOn: "folderOpen"`)
>
> **Advisory:** [GHSA-6xwp-cp5h-q856](https://github.com/BeProduct/beproduct-org-nestjs-auth/security/advisories/GHSA-6xwp-cp5h-q856) — full IOC list and remediation steps in [`SECURITY.md`](./SECURITY.md).

NestJS authentication module for BeProduct IDS (Identity Server) with OpenID Connect support.

## Features

- BeProduct OIDC authentication
- JWT-based session management
- Small JWT payload - tokens stored server-side
- Configurable with sync/async options
- TypeScript support with full type definitions
- `@CurrentUser()` decorator for easy user access
- Built-in guards for protected routes

## Installation

```bash
npm install @beproduct/nestjs-auth
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BeProductAuthModule } from '@beproduct/nestjs-auth';

@Module({
  imports: [
    BeProductAuthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        issuer: configService.get('OIDC_ISSUER'),
        authorizationURL: configService.get('OIDC_AUTHORIZATION_URL'),
        tokenURL: configService.get('OIDC_TOKEN_URL'),
        userInfoURL: configService.get('OIDC_USERINFO_URL'),
        clientID: configService.get('OIDC_CLIENT_ID'),
        clientSecret: configService.get('OIDC_CLIENT_SECRET'),
        callbackURL: configService.get('OIDC_CALLBACK_URL'),
        scope: ['openid', 'profile', 'email', 'BeProductPublicApi'],
        jwtSecret: configService.get('JWT_SECRET'),
        jwtExpiration: '30d',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 2. Environment Variables

```env
OIDC_ISSUER=https://id.winks.io/ids
OIDC_AUTHORIZATION_URL=https://id.winks.io/ids/connect/authorize
OIDC_TOKEN_URL=https://id.winks.io/ids/connect/token
OIDC_USERINFO_URL=https://id.winks.io/ids/connect/userinfo
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_CALLBACK_URL=http://localhost:3000/api/auth/callback/beproduct
JWT_SECRET=your-secret-key
```

### 3. Create Auth Controller

```typescript
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@beproduct/nestjs-auth';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('login')
  @UseGuards(AuthGuard('beproduct-oidc'))
  async login() {
    // Redirects to BeProduct IDS
  }

  @Get('callback')
  @UseGuards(AuthGuard('beproduct-oidc'))
  async callback(@Req() req: Request, @Res() res: Response) {
    // Handle successful authentication
    const user = req.user;
    res.redirect('/dashboard');
  }

  @Get('me')
  @UseGuards(AuthGuard('beproduct-jwt'))
  async getCurrentUser(@CurrentUser() user) {
    return user;
  }
}
```

## API Reference

### BeProductAuthModule

#### `forRoot(options: BeProductAuthOptions)`

Register the module with static configuration.

```typescript
BeProductAuthModule.forRoot({
  issuer: 'https://id.winks.io/ids',
  authorizationURL: 'https://id.winks.io/ids/connect/authorize',
  tokenURL: 'https://id.winks.io/ids/connect/token',
  userInfoURL: 'https://id.winks.io/ids/connect/userinfo',
  clientID: 'your_client_id',
  clientSecret: 'your_client_secret',
  callbackURL: 'http://localhost:3000/api/auth/callback',
  scope: ['openid', 'profile', 'email'],
  jwtSecret: 'your-jwt-secret',
  jwtExpiration: '30d',
})
```

#### `forRootAsync(options: BeProductAuthAsyncOptions)`

Register the module with async configuration (recommended).

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `issuer` | string | Yes | BeProduct IDS issuer URL |
| `authorizationURL` | string | Yes | OAuth authorization endpoint |
| `tokenURL` | string | Yes | OAuth token endpoint |
| `userInfoURL` | string | Yes | OIDC userinfo endpoint |
| `clientID` | string | Yes | OAuth client ID |
| `clientSecret` | string | Yes | OAuth client secret |
| `callbackURL` | string | Yes | OAuth callback URL |
| `scope` | string[] | No | OAuth scopes (default: `['openid', 'profile', 'email']`) |
| `jwtSecret` | string | Yes | Secret for signing JWT tokens |
| `jwtExpiration` | string | No | JWT expiration time (default: `'30d'`) |
| `validateUser` | function | No | Custom user validation function |

### Guards

**BeProduct OIDC Guard**
```typescript
@UseGuards(AuthGuard('beproduct-oidc'))
```

**JWT Guard**
```typescript
@UseGuards(AuthGuard('beproduct-jwt'))
```

### Decorators

**@CurrentUser()**

Get the authenticated user from the request.

```typescript
@Get('profile')
@UseGuards(AuthGuard('beproduct-jwt'))
getProfile(@CurrentUser() user: BeProductUser) {
  return user;
}

// Get specific property
@Get('email')
@UseGuards(AuthGuard('beproduct-jwt'))
getEmail(@CurrentUser('email') email: string) {
  return email;
}
```

### Interfaces

**BeProductUser**

```typescript
interface BeProductUser {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  locale?: string;
  accessToken?: string;
  refreshToken?: string;
  profile?: any;
}
```

## Custom User Validation

You can provide a custom user validation function to transform the BeProduct profile:

```typescript
BeProductAuthModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ... other options
    validateUser: async (profile, accessToken, refreshToken) => {
      // Custom logic here
      const user = await yourUserService.findOrCreate({
        externalId: profile.id,
        email: profile.emails[0].value,
        tokens: { accessToken, refreshToken },
      });

      return user;
    },
  }),
})
```

## Security Best Practices

### JWT Cookie Strategy

The module uses a secure JWT cookie approach:

- **Small JWT payload** (~200 bytes) - only contains user metadata
- **httpOnly cookies** - prevents XSS attacks
- **Secure flag** - enabled in production (HTTPS only)
- **SameSite** - set to 'lax' for CSRF protection

### Token Storage

- BeProduct access and refresh tokens are **NOT stored in JWT**
- Store tokens server-side (database, Redis, etc.)
- Retrieve tokens when needed for API calls to BeProduct services

## Example: Storing Tokens

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveUser(beproductUser: BeProductUser) {
    return this.userRepository.save({
      externalId: beproductUser.id,
      email: beproductUser.email,
      name: beproductUser.name,
      accessToken: beproductUser.accessToken, // Store server-side
      refreshToken: beproductUser.refreshToken, // Store server-side
    });
  }
}
```

## Authentication Flow

1. User visits `/auth/login`
2. Guard redirects to BeProduct IDS
3. User authenticates at BeProduct
4. BeProduct redirects to `/auth/callback` with authorization code
5. Module exchanges code for tokens
6. Module creates user and generates JWT
7. JWT stored in httpOnly cookie
8. User accesses protected routes with JWT

## License

MIT

## Support

- [GitHub Issues](https://github.com/BeProduct/beproduct-org-nestjs-auth/issues)
- [BeProduct Documentation](https://beproduct.com/docs)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
