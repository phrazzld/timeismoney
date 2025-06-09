/**
 * PriceBadge component class for creating and managing time conversion badges
 * Provides a clean OOP interface for badge lifecycle management
 *
 * @module components/PriceBadge
 */

import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import { generateBadgeStyles, generateIconStyles } from '../utils/styleGenerator.js';
import { createAccessibilityAttributes, announceToScreenReader } from '../utils/accessibility.js';
import * as logger from '../utils/logger.js';

/**
 * PriceBadge class for creating and managing time conversion badges
 * Encapsulates badge creation, styling, and lifecycle management
 *
 * @class PriceBadge
 */
export class PriceBadge {
  /**
   * Creates a new PriceBadge instance
   *
   * @param {object} config - Badge configuration
   * @param {string} config.originalPrice - The original price string (e.g., "$30.00")
   * @param {string} config.timeDisplay - The formatted time display (e.g., "3h 0m" or "45m")
   * @param {HTMLElement} [config.context] - DOM context for theme detection and styling
   * @param {object} [config.styleOverrides] - Custom style overrides
   * @param {string} [config.iconSize] - Icon size ('xs', 'sm', 'base', 'lg')
   * @param {boolean} [config.useIcon] - Whether to include the clock icon
   * @param {boolean} [config.responsive] - Whether to use responsive sizing (default: true)
   * @param {boolean} [config.conflictProtection] - Enable style conflict protection (default: true)
   * @param {boolean} [config.defensiveStyles] - Enable defensive styling (default: true)
   * @param {boolean} [config.minimalDefensive] - Use minimal defensive styling (default: false)
   * @param {boolean} [config.enableAccessibility] - Enable accessibility features (default: true)
   * @param {boolean} [config.verboseAccessibility] - Use verbose accessibility descriptions (default: false)
   * @param {boolean} [config.announceChanges] - Announce badge updates to screen readers (default: false)
   * @param {boolean} [config.enableAnimations] - Enable micro-interactions and animations (default: true)
   * @param {boolean} [config.enableHover] - Enable hover effects (default: true)
   * @param {boolean} [config.enableFocus] - Enable focus effects (default: true)
   * @param {boolean} [config.animateEntrance] - Animate badge when first rendered (default: true)
   * @param {boolean} [config.animateExit] - Animate badge when destroyed (default: true)
   * @param {boolean} [config.animateUpdates] - Animate badge content updates (default: true)
   */
  constructor(config) {
    this.config = {
      originalPrice: '',
      timeDisplay: '',
      context: null,
      styleOverrides: {},
      iconSize: 'xs',
      useIcon: true,
      responsive: true,
      conflictProtection: true,
      defensiveStyles: true,
      minimalDefensive: false,
      enableAccessibility: true,
      verboseAccessibility: false,
      announceChanges: false,
      enableAnimations: true,
      enableHover: true,
      enableFocus: true,
      animateEntrance: true,
      animateExit: true,
      animateUpdates: true,
      ...config,
    };

    this.element = null;
    this.tooltipElement = null;
    this.tooltipId = null;
    this.isRendered = false;
    this.isDestroyed = false;

    // Validate required configuration
    this._validateConfig();
  }

  /**
   * Validates the badge configuration
   *
   * @private
   * @throws {Error} If required configuration is missing
   */
  _validateConfig() {
    if (!this.config.originalPrice || typeof this.config.originalPrice !== 'string') {
      throw new Error('PriceBadge: originalPrice is required and must be a string');
    }

    if (!this.config.timeDisplay || typeof this.config.timeDisplay !== 'string') {
      throw new Error('PriceBadge: timeDisplay is required and must be a string');
    }
  }

  /**
   * Creates the clock icon SVG element
   *
   * @private
   * @returns {string} SVG string for the clock icon
   */
  _createClockIcon() {
    try {
      const iconStyles = generateIconStyles({
        size: this.config.iconSize,
        color: 'currentColor',
        responsive: this.config.responsive,
        conflictProtection: this.config.conflictProtection,
        defensiveStyles: false, // Icons typically don't need defensive styles
      });

      // Clear, recognizable clock icon with classic 10:10 positioning
      // Enhanced design with prominent hour markers and distinct hands
      return `<svg viewBox="0 0 16 16" style="${iconStyles}" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="8" r="0.5" fill="currentColor"/>
        
        <!-- Hour markers at 12, 3, 6, 9 -->
        <line x1="8" y1="2" x2="8" y2="3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="14" y1="8" x2="12.5" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="8" y1="14" x2="8" y2="12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="8" x2="3.5" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        
        <!-- Clock hands in classic 10:10 position -->
        <!-- Hour hand pointing to 10 (shorter, thicker) -->
        <line x1="8" y1="8" x2="5.5" y2="4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <!-- Minute hand pointing to 2 (longer, thinner) -->
        <line x1="8" y1="8" x2="11.5" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    } catch (error) {
      logger.error('Error creating clock icon:', error.message);
      return ''; // Return empty string if icon creation fails
    }
  }

  /**
   * Generates the badge styles using the style system
   *
   * @private
   * @param {'entrance'|'exit'|'update'|'none'} [animationState] - Current animation state
   * @returns {string} CSS string for badge styling
   */
  _generateStyles(animationState = 'none') {
    try {
      const defaultOverrides = {
        // Maintain host site integration but allow theme colors to take precedence
        opacity: '0.9',
        fontWeight: 'inherit',
        fontSize: 'inherit',
      };

      const badgeStyles = generateBadgeStyles({
        context: this.config.context,
        variant: 'default', // Auto-detects based on context
        responsive: this.config.responsive,
        conflictProtection: this.config.conflictProtection,
        defensiveStyles: this.config.defensiveStyles,
        minimalDefensive: this.config.minimalDefensive,
        animationState,
        enableAnimations: this.config.enableAnimations,
        enableHover: this.config.enableHover,
        enableFocus: this.config.enableFocus,
        overrides: {
          ...defaultOverrides,
          ...this.config.styleOverrides,
        },
      });

      return badgeStyles;
    } catch (error) {
      logger.error('Error generating badge styles:', error.message);
      // Return fallback styles
      return this._getFallbackStyles();
    }
  }

  /**
   * Gets fallback styles when style generation fails
   *
   * @private
   * @returns {string} Fallback CSS string
   */
  _getFallbackStyles() {
    return [
      'color: #059669', // Keep as fallback when style system fails completely
      'font-weight: 600',
      'font-size: inherit',
      'white-space: nowrap',
      'vertical-align: baseline',
      'text-decoration: none',
      'opacity: 0.9',
      'display: inline-flex',
      'align-items: center',
    ].join('; ');
  }

  /**
   * Creates the DOM element for the badge
   *
   * @private
   * @returns {HTMLElement} The created badge element
   */
  _createElement() {
    try {
      const element = document.createElement('span');
      element.className = CONVERTED_PRICE_CLASS;
      element.setAttribute('data-original-price', this.config.originalPrice);

      // Add accessibility attributes if enabled
      if (this.config.enableAccessibility) {
        const accessibilityConfig = createAccessibilityAttributes(
          this.config.originalPrice,
          this.config.timeDisplay,
          {
            useIcon: this.config.useIcon,
            verbose: this.config.verboseAccessibility,
            includeTooltip: true,
          }
        );

        // Apply ARIA attributes
        Object.entries(accessibilityConfig.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });

        // Store tooltip information for later creation
        this.tooltipId = accessibilityConfig.tooltipId;
        this.tooltipContent = accessibilityConfig.tooltipContent;
      } else {
        // Fallback to basic title attribute if accessibility disabled
        element.title = `Originally ${this.config.originalPrice}`;
      }

      // Create content with optional icon
      const clockIcon = this.config.useIcon ? this._createClockIcon() : '';
      element.innerHTML = `${clockIcon}${this.config.timeDisplay}`;

      // Apply styles with entrance animation if enabled
      const animationState =
        this.config.enableAnimations && this.config.animateEntrance ? 'entrance' : 'none';
      const styles = this._generateStyles(animationState);
      element.style.cssText = styles;

      // Create accessible tooltip if needed
      if (this.config.enableAccessibility && this.tooltipId && this.tooltipContent) {
        this._createAccessibleTooltip();
      }

      // Add hover toggle functionality if hover is enabled
      if (this.config.enableHover) {
        this._addHoverToggle(element);
      }

      return element;
    } catch (error) {
      logger.error('Error creating badge element:', error.message);
      return this._createFallbackElement();
    }
  }

  /**
   * Creates an accessible tooltip element for the badge
   * Uses proper ARIA relationships for screen reader compatibility
   *
   * @private
   */
  _createAccessibleTooltip() {
    try {
      if (!this.tooltipId || !this.tooltipContent) {
        return;
      }

      // Create tooltip element
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.id = this.tooltipId;
      this.tooltipElement.className = 'tim-accessible-tooltip';
      this.tooltipElement.textContent = this.tooltipContent;

      // Style tooltip to be visually hidden but accessible to screen readers
      this.tooltipElement.style.cssText = [
        'position: absolute',
        'width: 1px',
        'height: 1px',
        'padding: 0',
        'margin: -1px',
        'overflow: hidden',
        'clip: rect(0, 0, 0, 0)',
        'white-space: nowrap',
        'border: 0',
      ].join('; ');

      // Add tooltip to DOM (append to document body to avoid layout issues)
      document.body.appendChild(this.tooltipElement);

      logger.debug('Created accessible tooltip', {
        tooltipId: this.tooltipId,
        content: this.tooltipContent,
      });
    } catch (error) {
      logger.error('Error creating accessible tooltip:', error.message);
    }
  }

  /**
   * Adds hover functionality to toggle between time and price display
   * Smoothly transitions the badge content on hover
   *
   * @private
   * @param {HTMLElement} element - The badge element to add hover functionality to
   */
  _addHoverToggle(element) {
    try {
      if (!element) return;

      // Store the original content spans for toggling
      const timeContent = element.innerHTML;
      const priceContent = this.config.originalPrice;

      // Track hover state
      let isHovering = false;

      // Add smooth transition for content changes
      const currentTransition = element.style.transition || '';
      element.style.transition = currentTransition
        ? `${currentTransition}, opacity 200ms ease-out`
        : 'opacity 200ms ease-out';

      // Handle mouse enter - show original price
      element.addEventListener('mouseenter', () => {
        if (isHovering) return;
        isHovering = true;

        // Fade out, change content, fade in
        element.style.opacity = '0.7';

        setTimeout(() => {
          if (isHovering) {
            // Remove clock icon and show price
            element.textContent = priceContent;
            element.style.opacity = '1';
          }
        }, 100);
      });

      // Handle mouse leave - restore time display
      element.addEventListener('mouseleave', () => {
        if (!isHovering) return;
        isHovering = false;

        // Fade out, change content, fade in
        element.style.opacity = '0.7';

        setTimeout(() => {
          if (!isHovering) {
            // Restore time content with icon
            element.innerHTML = timeContent;
            element.style.opacity = '1';
          }
        }, 100);
      });

      logger.debug('Hover toggle added to badge', {
        originalPrice: this.config.originalPrice,
        timeDisplay: this.config.timeDisplay,
      });
    } catch (error) {
      logger.error('Error adding hover toggle:', error.message);
    }
  }

  /**
   * Creates a fallback element when main creation fails
   *
   * @private
   * @returns {HTMLElement} Simple fallback badge element
   */
  _createFallbackElement() {
    try {
      const element = document.createElement('span');
      element.className = CONVERTED_PRICE_CLASS;
      element.setAttribute('data-original-price', this.config.originalPrice);
      element.title = `Originally ${this.config.originalPrice}`;
      element.textContent = this.config.timeDisplay;
      element.style.cssText = this._getFallbackStyles();

      return element;
    } catch (fallbackError) {
      logger.error('Error creating fallback badge element:', fallbackError.message);
      // Last resort: return a simple text node wrapped in span
      const element = document.createElement('span');
      element.textContent = this.config.timeDisplay;
      return element;
    }
  }

  /**
   * Renders the badge and returns the DOM element
   *
   * @returns {HTMLElement} The rendered badge element
   * @throws {Error} If badge has already been destroyed
   */
  render() {
    if (this.isDestroyed) {
      throw new Error('Cannot render a destroyed PriceBadge instance');
    }

    if (this.isRendered && this.element) {
      logger.debug('PriceBadge already rendered, returning existing element');
      return this.element;
    }

    this.element = this._createElement();
    this.isRendered = true;

    // Announce to screen readers if enabled
    if (this.config.enableAccessibility && this.config.announceChanges) {
      const announcement = `Price converted to work time: ${this.config.timeDisplay}`;
      announceToScreenReader(announcement);
    }

    logger.debug('PriceBadge rendered successfully', {
      originalPrice: this.config.originalPrice,
      timeDisplay: this.config.timeDisplay,
      accessibilityEnabled: this.config.enableAccessibility,
    });

    return this.element;
  }

  /**
   * Updates the badge configuration and re-renders if necessary
   *
   * @param {object} newConfig - New configuration to merge
   * @returns {HTMLElement} The updated badge element
   */
  update(newConfig) {
    if (this.isDestroyed) {
      throw new Error('Cannot update a destroyed PriceBadge instance');
    }

    // Merge new configuration
    this.config = { ...this.config, ...newConfig };

    // Validate updated configuration
    this._validateConfig();

    // If already rendered, update the existing element
    if (this.isRendered && this.element) {
      // Update basic attributes
      this.element.setAttribute('data-original-price', this.config.originalPrice);

      // Update accessibility attributes if enabled
      if (this.config.enableAccessibility) {
        const accessibilityConfig = createAccessibilityAttributes(
          this.config.originalPrice,
          this.config.timeDisplay,
          {
            useIcon: this.config.useIcon,
            verbose: this.config.verboseAccessibility,
            includeTooltip: true,
          }
        );

        // Update ARIA attributes
        Object.entries(accessibilityConfig.attributes).forEach(([key, value]) => {
          this.element.setAttribute(key, value);
        });

        // Clean up old tooltip if it exists
        if (this.tooltipElement && this.tooltipElement.parentNode) {
          this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }

        // Update tooltip information
        this.tooltipId = accessibilityConfig.tooltipId;
        this.tooltipContent = accessibilityConfig.tooltipContent;

        // Create new accessible tooltip
        if (this.tooltipId && this.tooltipContent) {
          this._createAccessibleTooltip();
        }
      } else {
        // Fallback to basic title attribute if accessibility disabled
        this.element.title = `Originally ${this.config.originalPrice}`;
      }

      // Apply update animation if enabled
      if (this.config.enableAnimations && this.config.animateUpdates) {
        // Apply update animation first
        const updateStyles = this._generateStyles('update');
        this.element.style.cssText = updateStyles;

        // Wait for animation to complete, then update content
        setTimeout(() => {
          if (!this.isDestroyed && this.element) {
            // Update content
            const clockIcon = this.config.useIcon ? this._createClockIcon() : '';
            this.element.innerHTML = `${clockIcon}${this.config.timeDisplay}`;

            // Apply final styles
            const finalStyles = this._generateStyles('none');
            this.element.style.cssText = finalStyles;
          }
        }, 150); // Half of update animation duration for smoother effect
      } else {
        // Update content immediately without animation
        const clockIcon = this.config.useIcon ? this._createClockIcon() : '';
        this.element.innerHTML = `${clockIcon}${this.config.timeDisplay}`;

        // Update styles
        const styles = this._generateStyles();
        this.element.style.cssText = styles;
      }

      logger.debug('PriceBadge updated successfully', {
        originalPrice: this.config.originalPrice,
        timeDisplay: this.config.timeDisplay,
        accessibilityEnabled: this.config.enableAccessibility,
      });
    }

    return this.element || this.render();
  }

  /**
   * Destroys the badge, removing it from the DOM and cleaning up resources
   *
   * @returns {Promise<boolean>} Promise that resolves when destruction is complete
   */
  async destroy() {
    try {
      if (this.isDestroyed) {
        logger.debug('PriceBadge already destroyed');
        return true;
      }

      // Apply exit animation if enabled
      if (
        this.config.enableAnimations &&
        this.config.animateExit &&
        this.element &&
        this.element.parentNode
      ) {
        // Apply exit animation
        const exitStyles = this._generateStyles('exit');
        this.element.style.cssText = exitStyles;

        // Wait for animation to complete before removing
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 200); // Exit animation duration
        });
      }

      // Remove from DOM if it has a parent
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      // Clean up accessible tooltip
      if (this.tooltipElement && this.tooltipElement.parentNode) {
        this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      }

      // Note: No need to clean up hover event listeners as they'll be removed with the element

      // Clear references
      this.element = null;
      this.tooltipElement = null;
      this.tooltipId = null;
      this.tooltipContent = null;
      this.isRendered = false;
      this.isDestroyed = true;

      logger.debug('PriceBadge destroyed successfully');
      return true;
    } catch (error) {
      logger.error('Error destroying PriceBadge:', error.message);
      return false;
    }
  }

  /**
   * Gets the current badge configuration
   *
   * @returns {object} Current configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Gets the DOM element (if rendered)
   *
   * @returns {HTMLElement|null} The badge element or null if not rendered
   */
  getElement() {
    return this.element;
  }

  /**
   * Checks if the badge is currently rendered
   *
   * @returns {boolean} True if rendered
   */
  isRenderedState() {
    return this.isRendered && !this.isDestroyed;
  }

  /**
   * Checks if the badge has been destroyed
   *
   * @returns {boolean} True if destroyed
   */
  isDestroyedState() {
    return this.isDestroyed;
  }
}

/**
 * Factory function for creating PriceBadge instances
 * Provides a functional interface for backward compatibility
 *
 * @param {string} originalPrice - The original price string
 * @param {string} timeDisplay - The formatted time display
 * @param {HTMLElement} [context] - DOM context for theme detection
 * @param {object} [options] - Additional options
 * @returns {HTMLElement} The rendered badge element
 */
export const createPriceBadge = (originalPrice, timeDisplay, context = null, options = {}) => {
  try {
    const badge = new PriceBadge({
      originalPrice,
      timeDisplay,
      context,
      ...options,
    });

    return badge.render();
  } catch (error) {
    logger.error('Error in createPriceBadge factory function:', error.message);
    // Return a simple fallback element
    const fallback = document.createElement('span');
    fallback.textContent = timeDisplay;
    fallback.className = CONVERTED_PRICE_CLASS;
    fallback.title = `Originally ${originalPrice}`;
    return fallback;
  }
};

export default PriceBadge;
