# Security Policy

## Reporting Vulnerabilities

Please report security vulnerabilities by emailing **security@beproduct.com**, or via [GitHub's private security advisory flow](https://github.com/BeProduct/beproduct-org-nestjs-auth/security/advisories/new). Please do **not** open public GitHub issues for security problems.

## Past Security Advisories

### GHSA-6xwp-cp5h-q856 — Malicious code in @beproduct/nestjs-auth 0.1.2–0.1.19 (2026-05)

**Affected versions:** `>=0.1.2 <=0.1.19`
**Patched version:** `0.1.20`
**Severity:** Critical (CVSS 9.8)
**Weakness:** CWE-506 (Embedded Malicious Code)

#### Summary
On 2026-05-11, an attacker used a compromised npm publish token to publish 18 malicious versions of this package. The versions contained payloads from the **Mini Shai-Hulud** npm supply-chain worm (see [Aikido analysis](https://www.aikido.dev/blog/mini-shai-hulud-is-back-tanstack-compromised)). The poisoned versions were removed from the npm registry by npm Security on 2026-05-12. A clean republish was released as `0.1.20`.

#### Impact
Anyone who ran `npm install @beproduct/nestjs-auth` resolving to any version in `>=0.1.2 <=0.1.19` between **2026-05-11 20:19 UTC** and the npm Security takedown executed a postinstall script that attempted to harvest:

- npm tokens (`~/.npmrc`)
- GitHub personal access tokens, OAuth tokens, and Actions OIDC tokens
- AWS credentials (environment variables and `~/.aws/credentials`)
- HashiCorp Vault tokens

The exfiltration endpoint was `https://filev2.getsession.org`. The worm also dropped persistence files (`tanstack_runner.js` / `router_init.js`, plus `setup.mjs` loaders and IDE hook configs in `.claude/` and `.vscode/`) into developer working trees.

#### Indicators of compromise

| Indicator | Value |
|---|---|
| File name (payload) | `tanstack_runner.js`, `router_init.js`, `router_runtime.js` |
| SHA-256 (tanstack_runner.js) | `2ec78d556d696e208927cc503d48e4b5eb56b31abc2870c2ed2e98d6be27fc96` |
| SHA-256 (router_init.js) | `ab4fcadaec49c03278063dd269ea5eef82d24f2124a8e15d7b90f2fa8601266c` |
| Exfil endpoint | `filev2.getsession.org` |
| Side-channel endpoints | `169.254.169.254/latest/meta-data/iam/security-credentials/`, `registry.npmjs.org/-/npm/v1/tokens`, `vault.svc.cluster.local:8200` |
| IDE-hook drop pattern | `.claude/settings.json` with `SessionStart` hook + `.vscode/tasks.json` with `runOn: "folderOpen"` running `node .claude/setup.mjs` (or `.vscode/setup.mjs`) |

#### Required mitigation for affected installs

1. Remove the package and clean the npm cache:
   ```bash
   npm uninstall @beproduct/nestjs-auth
   npm cache clean --force
   ```
2. Install the clean version:
   ```bash
   npm install @beproduct/nestjs-auth@0.1.20
   ```
3. **Rotate every credential present in the install environment** at the time of install. At minimum:
   - Revoke and reissue all npm publish tokens.
   - Revoke and reissue all GitHub PATs and OAuth tokens (especially anything in `~/.npmrc` for `npm.pkg.github.com`).
   - Rotate AWS access keys.
   - Rotate any Vault tokens or other secrets that were present in environment variables.
4. Scan affected developer machines and CI runners for the indicators of compromise listed above. If found, treat the host as compromised and reimage.
5. Check IDE configurations (`.claude/settings.json`, `.vscode/tasks.json`) for unexpected hook entries that execute `setup.mjs`. The hooks themselves are no-ops if `bun` is already installed on the host, but their presence in committed repository history indicates the worm had write access.

#### Timeline

| Time (UTC) | Event |
|---|---|
| 2026-05-11 20:19:43 | First malicious version (`0.1.2`) published |
| 2026-05-11 22:56:39 | Final malicious version (`0.1.19`) published — 18 versions total in 2h37m |
| 2026-05-12 ~14:12 | npm Security removes the malicious versions from the registry |
| 2026-05-13 | BeProduct discovers the incident via [Aikido's public disclosure](https://www.aikido.dev/blog/mini-shai-hulud-is-back-tanstack-compromised) and begins remediation |
| 2026-05-14 | Compromised npm publish token revoked server-side, BeProduct GitHub OAuth credentials rotated |
| 2026-05-14 | Clean release `0.1.20` published; this advisory filed |

#### Root cause
The compromised npm publish token was harvested by a Mini-Shai-Hulud-infected transitive dependency consumed by an automated GitHub coding agent runtime that had read access to the `NPM_TOKEN` GitHub Actions secret for an unrelated repository under the same npm publisher account. The publish itself was performed by the attacker against the public npm registry; the source repository for this package was never modified by the attacker.

#### Credits
- Detection: [Aikido Security](https://www.aikido.dev/) — public disclosure of the Mini Shai-Hulud campaign on 2026-05-12.
- Coordination: npm Security (registry takedown).
