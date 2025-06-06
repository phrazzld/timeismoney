/**
 * Security configuration for automated dependency vulnerability scanning.
 * Defines policies for vulnerability handling, severity thresholds, and escalation procedures.
 *
 * @file Centralized security configuration for the security audit system
 */

/**
 * Security configuration object containing vulnerability policies and escalation procedures
 *
 * @type {object}
 */
export const SECURITY_CONFIG = {
  /**
   * Vulnerability handling policies
   */
  vulnerability: {
    /**
     * Severity levels that will cause CI builds to fail
     *
     * @type {string[]}
     */
    failOnSeverity: ['critical', 'high'],

    /**
     * Temporarily approved vulnerabilities that should be ignored
     * Each entry should include: { id, reason, expires }
     *
     * @type {Array}
     */
    allowList: [
      {
        id: 'test-critical-vulnerability',
        reason: 'Testing allowlist functionality - will be removed',
        expires: '2024-12-31',
      },
    ],

    /**
     * Maximum age in days before forcing update of vulnerable dependencies
     *
     * @type {number}
     */
    maxAge: 90,
  },

  /**
   * Escalation timeframes for vulnerability response
   */
  escalation: {
    /**
     * Critical vulnerabilities require immediate response (< 4 hours)
     *
     * @type {string}
     */
    critical: 'immediate',

    /**
     * High severity vulnerabilities require response within 24 hours
     *
     * @type {string}
     */
    high: '24h',

    /**
     * Medium severity vulnerabilities require response within 7 days
     *
     * @type {string}
     */
    medium: '7d',
  },
};
