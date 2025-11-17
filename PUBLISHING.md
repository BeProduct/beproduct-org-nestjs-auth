# Publishing @beproduct/nestjs-auth to npm

This guide walks you through publishing the package to npm.

## Prerequisites

1. **npm Account**: You need an npm account with access to the `@beproduct` organization
2. **npm CLI**: Installed globally (`npm` comes with Node.js)
3. **Repository Access**: Push access to https://github.com/BeProduct/beproduct-org-nestjs-auth

## Step-by-Step Publishing Guide

### 1. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted. Ensure you have access to the `@beproduct` organization.

### 2. Verify Package Configuration

Check that everything is correct:

```bash
# View what will be published
npm pack --dry-run

# Or create an actual tarball to inspect
npm pack
tar -tzf beproduct-nestjs-auth-0.1.0.tgz
```

This should show:
- `dist/` - Compiled JavaScript and type definitions
- `README.md` - Documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

It should **NOT** include:
- `src/` - Source TypeScript files
- `node_modules/` - Dependencies
- `.git/` - Git files

### 3. Build the Package

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 4. Test the Package Locally (Optional)

Before publishing, test the package works:

```bash
# In another project
npm install /path/to/beproduct-org-nestjs-auth

# Or use npm link
cd /path/to/beproduct-org-nestjs-auth
npm link

cd /path/to/your-test-project
npm link @beproduct/nestjs-auth
```

### 5. Publish to npm

```bash
# Publish as public package
npm publish --access public
```

The `--access public` flag is required for scoped packages (`@beproduct/*`) to be publicly accessible.

### 6. Verify Publication

Visit your package on npm:
- https://www.npmjs.com/package/@beproduct/nestjs-auth

Test installation:
```bash
npm install @beproduct/nestjs-auth
```

## Version Updates

When publishing updates:

### 1. Update Version

Use semantic versioning (SemVer):

```bash
# Patch release (bug fixes): 0.1.0 -> 0.1.1
npm version patch

# Minor release (new features): 0.1.0 -> 0.2.0
npm version minor

# Major release (breaking changes): 0.1.0 -> 1.0.0
npm version major
```

This will:
- Update `package.json` version
- Create a git commit
- Create a git tag

### 2. Push Changes

```bash
git push && git push --tags
```

### 3. Rebuild and Publish

```bash
npm run build
npm publish --access public
```

### 4. Create GitHub Release (Optional)

Go to https://github.com/BeProduct/beproduct-org-nestjs-auth/releases and create a release for the new version tag.

## Automation with GitHub Actions (Optional)

You can automate publishing with GitHub Actions. Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then add `NPM_TOKEN` to your GitHub repository secrets.

## Troubleshooting

### Error: "You do not have permission to publish"

Make sure:
- You're logged in: `npm whoami`
- You have access to `@beproduct` organization
- The package name is available

### Error: "Package already exists"

- The version number must be higher than the last published version
- Use `npm version` to bump the version

### Error: "Missing devDependencies"

- Run `npm install` before building
- Ensure all peer dependencies are in `devDependencies` for building

## Post-Publishing Checklist

- [ ] Package appears on npm: https://www.npmjs.com/package/@beproduct/nestjs-auth
- [ ] README renders correctly on npm
- [ ] Installation works: `npm install @beproduct/nestjs-auth`
- [ ] GitHub release created (if applicable)
- [ ] Documentation updated
- [ ] Announce on relevant channels

## Support

For issues with publishing, contact the BeProduct team or open an issue on GitHub.
