/**
 * ShadowPriceBadge component - PriceBadge with Shadow DOM encapsulation
 * Provides perfect style isolation from host site CSS while maintaining all features
 *
 * @module components/ShadowPriceBadge
 */

import { PriceBadge } from './PriceBadge.js';
import { detectBackgroundTheme } from '../utils/styleGenerator.js';
import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import * as logger from '../utils/logger.js';

/**
 * ShadowPriceBadge class - extends PriceBadge with Shadow DOM support
 * Provides complete style isolation while maintaining compatibility
 *
 * @class ShadowPriceBadge
 * @augments PriceBadge
 */
export class ShadowPriceBadge extends PriceBadge {
  /**
   * Creates a new ShadowPriceBadge instance
   *
   * @param {string} originalPrice - The original price string (e.g., "$30.00")
   * @param {string} timeDisplay - The formatted time display (e.g., "3h 0m")
   * @param {HTMLElement} [context] - DOM context for theme detection
   * @param {object} [config] - Additional configuration options
   */
  constructor(originalPrice, timeDisplay, context = null, config = {}) {
    // Convert legacy constructor to new config format
    const badgeConfig = {
      originalPrice,
      timeDisplay,
      context,
      ...config,
    };

    super(badgeConfig);

    // Detect Shadow DOM support
    this.useShadowDOM = ShadowPriceBadge.supportsShadowDOM();

    // Detect host theme before creating Shadow DOM (since we won't have access after)
    this.hostTheme = this._detectHostTheme(context);

    logger.debug('ShadowPriceBadge created', {
      useShadowDOM: this.useShadowDOM,
      originalPrice,
      timeDisplay,
      hostTheme: this.hostTheme,
    });
  }

  /**
   * Detects if Shadow DOM is supported in current browser
   *
   * @static
   * @returns {boolean} True if Shadow DOM is supported
   */
  static supportsShadowDOM() {
    return typeof Element !== 'undefined' && 'attachShadow' in Element.prototype;
  }

  /**
   * Detects the theme of the host element
   *
   * @private
   * @param {HTMLElement} context - Host element context
   * @returns {object} Theme information
   */
  _detectHostTheme(context) {
    try {
      if (!context) {
        // Provide sensible defaults when no context available
        return {
          isDark: false,
          textColor: '#333333',
          backgroundColor: '#ffffff',
          theme: 'light',
        };
      }

      const detectedTheme = detectBackgroundTheme(context);
      const isDark = detectedTheme === 'dark';

      return {
        isDark,
        textColor: isDark ? '#ffffff' : '#333333',
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        theme: detectedTheme,
      };
    } catch (error) {
      logger.warn('Theme detection failed, using defaults:', error.message);
      return {
        isDark: false,
        textColor: '#333333',
        backgroundColor: '#ffffff',
        theme: 'light',
      };
    }
  }

  /**
   * Generates CSS for Shadow DOM content
   *
   * @private
   * @returns {string} CSS string for shadow content
   */
  getShadowCSS() {
    const theme = this.hostTheme;

    return `
      :host {
        display: inline-flex;
        align-items: center;
        color: ${theme.textColor || '#059669'};
        font-weight: 600;
        font-size: 0.95em;
        white-space: nowrap;
        vertical-align: baseline;
        text-decoration: none;
        opacity: 0.9;
        cursor: help;
        box-sizing: border-box;
        /* Reset any inherited styles */
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        font-family: inherit;
        line-height: inherit;
      }

      .badge-content {
        display: inline-flex;
        align-items: center;
        gap: 0.25em;
        pointer-events: none;
      }

      .time-text {
        font-weight: inherit;
        font-size: inherit;
        color: inherit;
      }

      svg {
        width: 1em;
        height: 1em;
        vertical-align: text-bottom;
        flex-shrink: 0;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      svg circle.center {
        fill: currentColor;
        stroke: none;
      }

      svg circle.marker {
        fill: currentColor;
        stroke: none;
      }

      /* Hover effects */
      :host(:hover) {
        opacity: 1;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        :host {
          color: ${theme.isDark ? '#ffffff' : '#000000'};
          font-weight: 700;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }
      }
    `;
  }

  /**
   * Generates HTML content for Shadow DOM
   *
   * @private
   * @returns {string} HTML string for shadow content
   */
  getShadowHTML() {
    const clockIcon = this.config.useIcon
      ? `
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/>
        <circle cx="8" cy="8" r="0.8" fill="currentColor" class="center"/>
        <path d="M8 4.5 L8 8 L6.2 5.8" stroke="currentColor" stroke-width="1.2" fill="none"/>
        <path d="M8 8 L10.5 5.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
        <circle cx="8" cy="3" r="0.3" fill="currentColor" class="marker"/>
        <circle cx="13" cy="8" r="0.3" fill="currentColor" class="marker"/>
        <circle cx="8" cy="13" r="0.3" fill="currentColor" class="marker"/>
        <circle cx="3" cy="8" r="0.3" fill="currentColor" class="marker"/>
      </svg>
    `
      : '';

    return `
      <div class="badge-content">
        ${clockIcon}
        <span class="time-text">${this.config.timeDisplay}</span>
      </div>
    `;
  }

  /**
   * Creates Shadow DOM content for the badge
   *
   * @private
   * @returns {string} Complete shadow content with styles and HTML
   */
  getShadowDOMContent() {
    const styles = `<style>${this.getShadowCSS()}</style>`;
    const html = this.getShadowHTML();
    return styles + html;
  }

  /**
   * Generates proper ARIA label for accessibility
   *
   * @returns {string} ARIA label content
   */
  getAriaLabel() {
    const originalPrice = this.config.originalPrice;
    const timeDisplay = this.config.timeDisplay;

    // Convert time display to more natural language
    const timeText = timeDisplay
      .replace(/(\d+)h/g, '$1 hours')
      .replace(/(\d+)m/g, '$1 minutes')
      .replace(/^0 hours\s*/, '') // Remove "0 hours" prefix
      .trim();

    return `Originally ${originalPrice}. This price equals ${timeText} of work time based on your hourly wage.`;
  }

  /**
   * Renders the badge with Shadow DOM encapsulation
   *
   * @private
   * @returns {HTMLElement} Shadow DOM host element
   */
  _renderWithShadowDOM() {
    try {
      // Create host element
      const host = document.createElement('span');
      host.className = `${CONVERTED_PRICE_CLASS} tim-badge-host`;
      host.setAttribute('data-original-price', this.config.originalPrice);

      // Set accessibility attributes on host element
      if (this.config.enableAccessibility) {
        host.setAttribute('role', 'img');
        host.setAttribute('aria-label', this.getAriaLabel());
        host.setAttribute('tabindex', '0'); // Make focusable for keyboard users
      } else {
        // Fallback to basic title
        host.title = `Originally ${this.config.originalPrice}`;
      }

      // Attach shadow root
      const shadow = host.attachShadow({ mode: 'open' });

      // Inject content
      shadow.innerHTML = this.getShadowDOMContent();

      logger.debug('Shadow DOM badge created successfully', {
        originalPrice: this.config.originalPrice,
        timeDisplay: this.config.timeDisplay,
        shadowMode: 'open',
      });

      return host;
    } catch (error) {
      logger.error('Shadow DOM creation failed:', error.message);
      // Fall back to regular rendering
      throw error;
    }
  }

  /**
   * Renders the badge element
   * Uses Shadow DOM if supported, falls back to regular rendering otherwise
   *
   * @override
   * @returns {HTMLElement} The rendered badge element
   */
  render() {
    if (this.isDestroyed) {
      throw new Error('Cannot render a destroyed ShadowPriceBadge instance');
    }

    if (this.isRendered && this.element) {
      logger.debug('ShadowPriceBadge already rendered, returning existing element');
      return this.element;
    }

    try {
      if (this.useShadowDOM) {
        this.element = this._renderWithShadowDOM();
        logger.debug('Rendered with Shadow DOM encapsulation');
      } else {
        // Fall back to parent class rendering
        this.element = super.render();
        logger.debug('Rendered with fallback to regular PriceBadge');
        return this.element;
      }
    } catch (shadowError) {
      logger.warn(
        'Shadow DOM rendering failed, falling back to regular rendering:',
        shadowError.message
      );

      // Mark as not using Shadow DOM and render normally
      this.useShadowDOM = false;
      this.element = super.render();
    }

    this.isRendered = true;

    // Announce to screen readers if enabled
    if (this.config.enableAccessibility && this.config.announceChanges) {
      const announcement = `Price converted to work time: ${this.config.timeDisplay}`;
      // Import announceToScreenReader here to avoid circular dependencies
      import('../utils/accessibility.js')
        .then(({ announceToScreenReader }) => {
          announceToScreenReader(announcement);
        })
        .catch((importError) => {
          logger.debug('Could not announce to screen reader:', importError.message);
        });
    }

    logger.debug('ShadowPriceBadge rendered successfully', {
      originalPrice: this.config.originalPrice,
      timeDisplay: this.config.timeDisplay,
      useShadowDOM: this.useShadowDOM,
      accessibilityEnabled: this.config.enableAccessibility,
    });

    return this.element;
  }

  /**
   * Destroys the badge and cleans up resources
   * Handles both Shadow DOM and regular cleanup
   *
   * @override
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      if (this.element && this.useShadowDOM) {
        // For Shadow DOM, we just need to remove the host element
        // Shadow DOM content is automatically cleaned up
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      } else {
        // Use parent class cleanup for regular rendering
        super.destroy();
        return;
      }

      this.element = null;
      this.isRendered = false;
      this.isDestroyed = true;

      logger.debug('ShadowPriceBadge destroyed successfully');
    } catch (error) {
      logger.error('Error destroying ShadowPriceBadge:', error.message);
    }
  }
}

/**
 * Factory function for creating ShadowPriceBadge instances
 * Provides a convenient API for creating badges with Shadow DOM support
 *
 * @param {string} originalPrice - The original price string
 * @param {string} timeDisplay - The formatted time display
 * @param {HTMLElement} [context] - DOM context for theme detection
 * @param {object} [config] - Additional configuration options
 * @returns {HTMLElement} The rendered badge element
 */
export function createShadowPriceBadge(originalPrice, timeDisplay, context = null, config = {}) {
  try {
    const badge = new ShadowPriceBadge(originalPrice, timeDisplay, context, config);
    return badge.render();
  } catch (error) {
    logger.error('Error in createShadowPriceBadge factory function:', error.message);

    // Fallback to regular PriceBadge on error
    try {
      const fallbackBadge = new PriceBadge({
        originalPrice,
        timeDisplay,
        context,
        ...config,
      });
      return fallbackBadge.render();
    } catch (fallbackError) {
      logger.error('Fallback badge creation also failed:', fallbackError.message);
      throw fallbackError;
    }
  }
}
