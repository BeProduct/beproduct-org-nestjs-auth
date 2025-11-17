# @beproduct/nestjs-auth

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
