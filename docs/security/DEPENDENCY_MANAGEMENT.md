# Dependency Management Guide

This document provides comprehensive guidelines for managing dependencies in the TimeIsMoney Chrome extension project, including automated updates, security considerations, and allowlist management.

## Overview

Our dependency management strategy balances security, stability, and development velocity through automated tooling and structured processes. We use a dual-track approach that distinguishes between low-risk updates (patch/minor versions) and high-risk changes (major versions) to enable safe automation while maintaining appropriate oversight.

## Dependency Update Strategy

### Automated Low-Risk Updates

**Scope**: Patch and minor version updates (semver-compatible changes)
- **Schedule**: Daily at 09:00 UTC
- **Auto-merge**: Enabled when all CI checks pass
- **Review**: No manual review required
- **Labels**: `dependencies`, `auto-merge`

**Rationale**: Patch and minor updates typically contain bug fixes and backward-compatible features with minimal breaking change risk, making them suitable for automation.

### Manual High-Risk Updates

**Scope**: Major version updates (potential breaking changes)
- **Schedule**: Weekly on Mondays at 09:00 UTC  
- **Review**: Security team approval required
- **Labels**: `dependencies`, `major-update`, `requires-review`
- **Process**: Standard pull request workflow with human oversight

**Rationale**: Major version updates can introduce breaking changes, new vulnerabilities, or significant behavior changes requiring careful assessment.

## Dependabot Configuration

Our dependabot configuration uses a single update policy with intelligent auto-merge detection:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
      time: "09:00"
    open-pull-requests-limit: 15
    commit-message:
      prefix: "chore(deps)"
      include: "scope"
    labels: ["dependencies"]
    # Group patch and minor updates to reduce PR volume
    groups:
      minor-and-patch:
        patterns: ["*"]
        update-types: ["minor", "patch"]
```

**Auto-merge Detection**: The GitHub Actions workflow automatically detects update types by checking PR titles for the "minor-and-patch" group name, enabling auto-merge for low-risk updates while flagging major updates for manual review.

## Security Integration

### Automated Security Scanning

All dependency updates trigger our security pipeline:

1. **Vulnerability Detection**: `pnpm audit` scans for known vulnerabilities
2. **Policy Enforcement**: Critical/High severity vulnerabilities block CI
3. **Allowlist Processing**: Temporarily approved vulnerabilities are bypassed
4. **Report Generation**: Security reports generated for all builds

### Security-First Prioritization

- **Security Updates**: Prioritized regardless of version type (patch/minor/major)
- **Critical/High Vulnerabilities**: Block all deployments until resolved
- **Medium/Low Vulnerabilities**: Tracked but don't block development

### CI Integration Requirements

All dependency changes must pass:
- ✅ **Lint**: ESLint with zero warnings tolerance
- ✅ **Tests**: Full test suite (unit, integration, DOM tests)
- ✅ **Security**: Vulnerability scanning and policy enforcement
- ✅ **Build**: Successful Chrome extension build process

## Allowlist Management

### Purpose and Scope

The allowlist provides temporary approval for known vulnerabilities when:
- No upstream fix is available
- Vulnerability is assessed as low risk in our context
- Fix requires extended testing due to breaking changes
- Emergency circumstances require temporary bypass

### Allowlist Entry Structure

Each allowlist entry must include:

```javascript
{
  id: 'vulnerability-id-or-cve',           // Unique identifier
  reason: 'Detailed justification',        // Why allowlisted
  expires: 'YYYY-MM-DD',                   // Mandatory expiration
  approvedBy: 'security-team-member',      // Approval authority
  reviewDate: 'YYYY-MM-DD'                 // Last review date
}
```

### Management Procedures

#### Adding Allowlist Entries

1. **Risk Assessment**: Document vulnerability impact and exploitability
2. **Justification**: Provide detailed rationale for temporary approval
3. **Time Limitation**: Set expiration date (maximum 90 days)
4. **Approval Process**:
   - **Critical/High**: Security team lead approval required
   - **Medium/Low**: Any security team member can approve
5. **Documentation**: Update `scripts/security-config.js`

#### Removing Allowlist Entries

1. **Automatic Expiration**: Entries expire on specified date
2. **Fix Available**: Remove when upstream patches are released
3. **Risk Change**: Remove if threat landscape changes
4. **Regular Review**: Monthly review of all active entries

#### Allowlist Review Process

**Monthly Review Cycle**:
- Review all allowlist entries approaching expiration
- Assess if upstream fixes have become available
- Evaluate continued risk acceptance
- Update expiration dates or remove entries as appropriate

**Review Criteria**:
- Has an upstream fix been released?
- Has the risk profile changed?
- Are we approaching the 90-day maximum allowlist period?
- Do we have sufficient resources to implement a fix?

## Manual Dependency Management

### Emergency Security Updates

For critical security vulnerabilities requiring immediate updates:

1. **Assessment**: Confirm vulnerability affects our usage
2. **Impact Analysis**: Evaluate update impact on application
3. **Testing Strategy**: Plan focused testing for critical paths
4. **Emergency Process**: Use expedited review and approval
5. **Post-Update Validation**: Verify fix effectiveness and no regressions

### Dependency Evaluation Criteria

When reviewing major version updates, consider:

**Security Factors**:
- Does the update fix known vulnerabilities?
- Are there new security features or improvements?
- Has the security posture of the package improved?

**Compatibility Factors**:
- Are there breaking API changes?
- Do our usage patterns still work?
- Are there deprecated features we rely on?

**Quality Factors**:
- Is the new version stable?
- Are there significant bug reports?
- How mature is the new major version?

**Maintenance Factors**:
- Is the old version still supported?
- How long until security support ends?
- What is the migration effort required?

## Best Practices

### Development Workflow

1. **Regular Monitoring**: Check dependabot PRs daily
2. **Prompt Review**: Address major version updates within one week
3. **Security Priority**: Prioritize security updates over feature work
4. **Test Coverage**: Ensure good test coverage before accepting auto-updates
5. **Documentation**: Update documentation when dependencies change behavior

### Package Selection

When adding new dependencies:

1. **Security Evaluation**: Check for known vulnerabilities
2. **Maintenance Status**: Verify active maintenance and support
3. **Community Trust**: Evaluate package reputation and usage
4. **License Compatibility**: Ensure license compatibility
5. **Size Impact**: Consider bundle size implications

### Version Pinning Strategy

- **Production Dependencies**: Pin major versions, allow minor/patch updates
- **Development Dependencies**: Allow broader version ranges for tooling
- **Security-Critical Packages**: Pin specific versions when necessary
- **Transitive Dependencies**: Monitor through automated scanning

## Troubleshooting Common Issues

### Auto-Merge Failures

If auto-merge fails for low-risk updates:

1. **Check CI Status**: Verify all checks are passing
2. **Review Test Failures**: Investigate any test regressions  
3. **Security Scan Issues**: Check for new vulnerabilities
4. **Manual Intervention**: Convert to manual review if needed

### Conflicting Updates

When multiple dependency updates conflict:

1. **Assess Compatibility**: Check if updates can be combined
2. **Prioritize Security**: Security updates take precedence
3. **Incremental Approach**: Apply updates one at a time
4. **Test Thoroughly**: Verify compatibility after each update

### Allowlist Management Issues

Common allowlist scenarios:

1. **Expired Entries**: Remove or renew based on current risk
2. **False Positives**: Add to allowlist with clear justification
3. **Upstream Delays**: Extend allowlist period with approval
4. **Risk Escalation**: Remove from allowlist if risk increases

## Monitoring and Metrics

### Key Performance Indicators

- **Update Velocity**: Time from dependabot PR to merge
- **Security Coverage**: Percentage of dependencies without known vulnerabilities
- **Allowlist Health**: Number and age of allowlist entries
- **Auto-merge Success Rate**: Percentage of low-risk updates merged automatically

### Regular Reporting

**Weekly**: Dependency update summary and any security issues
**Monthly**: Allowlist review and security metrics
**Quarterly**: Dependency health assessment and strategy review

## Integration Points

### CI/CD Pipeline
- Automated vulnerability scanning on every build
- Security report generation and artifact upload
- Blocking behavior for critical/high severity issues

### GitHub Integration
- Dependabot PR creation and labeling
- Auto-merge workflow for approved updates
- Security advisory notifications and tracking

### Development Tools
- `pnpm audit` for local vulnerability scanning
- Security configuration management through code
- Automated report generation and metrics collection

## Emergency Procedures

### Critical Vulnerability Response

1. **Immediate Assessment** (< 1 hour): Confirm impact and exploitability
2. **Rapid Patching** (< 4 hours): Apply available security updates
3. **Allowlist Consideration**: Temporary allowlist if no fix available
4. **Emergency Bypass**: Use `[skip security]` with security lead approval
5. **Post-Incident Review**: Document lessons learned and improve processes

### Dependency Supply Chain Attacks

1. **Detection**: Monitor for unusual dependency changes
2. **Investigation**: Verify legitimacy of updates and maintainers
3. **Isolation**: Block suspicious updates pending investigation
4. **Communication**: Alert team and stakeholders immediately
5. **Recovery**: Roll back to known-good versions if necessary

---

## Quick Reference

### Key Commands

```bash
# Manual dependency vulnerability scan
pnpm audit --audit-level=high

# Update specific package
pnpm update package-name

# Check for outdated packages
pnpm outdated

# Install with exact versions
pnpm install --save-exact package-name
```

### Configuration Files

- **Dependabot Config**: `.github/dependabot.yml`
- **Security Config**: `scripts/security-config.js`
- **Package Manifest**: `package.json`
- **Lock File**: `pnpm-lock.yaml`

### Important Links

- [Vulnerability Response Procedures](./VULNERABILITY_RESPONSE.md)
- [Escalation Procedures](./ESCALATION_PROCEDURES.md)
- [Security Configuration](../../scripts/security-config.js)
- [Dependabot Configuration](../../.github/dependabot.yml)

---

*This document is maintained by the Security Team and updated as processes evolve.*