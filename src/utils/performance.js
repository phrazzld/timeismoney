/**
 * Performance Measurement Utility
 * Provides tools for measuring, tracking, and analyzing performance metrics
 * for the Time Is Money extension.
 *
 * @module utils/performance
 */

import * as logger from './logger.js';

// Performance measurements store
const measurements = {
  marks: new Map(),
  measures: new Map(),
};

// Performance statistics for each metric
const statistics = new Map();

/**
 * Marks the start of a performance measurement
 *
 * @param {string} name - Name of the mark
 * @returns {void}
 */
export function mark(name) {
  try {
    // Check if browser Performance API is available
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      // Use native Performance API if available
      performance.mark(`tim_${name}_start`);
    }

    // Store the mark in our measurements
    measurements.marks.set(`${name}_start`, performance.now());

    logger.debug(`Performance mark: ${name}_start`);
  } catch (error) {
    logger.error('Error in performance mark:', error.message, error.stack);
  }
}

/**
 * Marks the end of a performance measurement and records the duration
 *
 * @param {string} name - Name of the mark (same as used in mark())
 * @returns {number|null} Duration in milliseconds, or null if start mark not found
 */
export function measure(name) {
  try {
    const endTime = performance.now();
    const startMark = measurements.marks.get(`${name}_start`);

    if (!startMark) {
      logger.warn(`No start mark found for: ${name}`);
      return null;
    }

    const duration = endTime - startMark;

    // Use native Performance API if available
    if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
      try {
        performance.measure(`tim_${name}`, `tim_${name}_start`);
      } catch (e) {
        // Silently fail if measure doesn't work (e.g., if mark wasn't properly set)
      }
    }

    // Store the measurement
    measurements.measures.set(name, duration);

    // Update statistics
    updateStatistics(name, duration);

    logger.debug(`Performance measure: ${name} = ${duration.toFixed(2)}ms`);

    return duration;
  } catch (error) {
    logger.error('Error in performance measure:', error.message, error.stack);
    return null;
  }
}

/**
 * Updates statistical information for a measurement
 *
 * @param {string} name - Name of the measurement
 * @param {number} duration - Duration in milliseconds
 * @private
 */
function updateStatistics(name, duration) {
  if (!statistics.has(name)) {
    statistics.set(name, {
      count: 0,
      total: 0,
      min: Infinity,
      max: -Infinity,
      values: [],
    });
  }

  const stats = statistics.get(name);
  stats.count += 1;
  stats.total += duration;
  stats.min = Math.min(stats.min, duration);
  stats.max = Math.max(stats.max, duration);

  // Store last 100 values for percentile calculations
  stats.values.push(duration);
  if (stats.values.length > 100) {
    stats.values.shift();
  }
}

/**
 * Gets statistics for a specific measurement
 *
 * @param {string} name - Name of the measurement
 * @returns {object|null} Statistics object with count, avg, min, max, etc. or null if no data
 */
export function getStatistics(name) {
  try {
    if (!statistics.has(name)) {
      return null;
    }

    const stats = statistics.get(name);
    const sortedValues = [...stats.values].sort((a, b) => a - b);

    return {
      count: stats.count,
      avg: stats.total / stats.count,
      min: stats.min,
      max: stats.max,
      p50: percentile(sortedValues, 50),
      p95: percentile(sortedValues, 95),
      p99: percentile(sortedValues, 99),
    };
  } catch (error) {
    logger.error('Error getting statistics:', error.message, error.stack);
    return null;
  }
}

/**
 * Calculates percentile value from sorted array
 *
 * @param {Array<number>} sortedValues - Sorted array of values
 * @param {number} p - Percentile to calculate (0-100)
 * @returns {number} The calculated percentile value
 * @private
 */
function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

/**
 * Gets all performance statistics
 *
 * @returns {object} Object with all measurement statistics
 */
export function getAllStatistics() {
  const allStats = {};

  for (const [name] of statistics) {
    allStats[name] = getStatistics(name);
  }

  return allStats;
}

/**
 * Creates a high resolution timeline with nested spans
 * for detailed performance profiling
 *
 * @param {string} name - Name for the timeline
 * @returns {object} Timeline object with methods to create spans
 */
export function createTimeline(name = 'main') {
  const timeline = {
    name,
    startTime: performance.now(),
    endTime: null,
    children: [],
    currentSpan: null,

    /**
     * Starts a new nested span in the timeline
     *
     * @param {string} spanName - Name of the span
     * @returns {object} The created span
     */
    startSpan(spanName) {
      const span = {
        name: spanName,
        startTime: performance.now(),
        endTime: null,
        parent: this.currentSpan || this,
        children: [],
      };

      if (this.currentSpan) {
        this.currentSpan.children.push(span);
      } else {
        this.children.push(span);
      }

      this.currentSpan = span;
      return span;
    },

    /**
     * Ends the current span and returns to parent
     *
     * @returns {number} Duration of the completed span
     */
    endSpan() {
      if (!this.currentSpan) {
        logger.warn('No active span to end');
        return 0;
      }

      this.currentSpan.endTime = performance.now();
      const duration = this.currentSpan.endTime - this.currentSpan.startTime;

      // Return to parent span
      this.currentSpan = this.currentSpan.parent === this ? null : this.currentSpan.parent;

      return duration;
    },

    /**
     * Ends the timeline and returns the complete data
     *
     * @returns {object} Timeline data with durations
     */
    end() {
      // End any active spans
      while (this.currentSpan) {
        this.endSpan();
      }

      this.endTime = performance.now();
      return this.getData();
    },

    /**
     * Gets the complete timeline data with durations
     *
     * @returns {object} Processed timeline data
     */
    getData() {
      return processTimelineNode(this);
    },
  };

  return timeline;
}

/**
 * Processes a timeline node to calculate durations and format data
 *
 * @param {object} node - Timeline node to process
 * @returns {object} Processed node with durations
 * @private
 */
function processTimelineNode(node) {
  const endTime = node.endTime || performance.now();
  const duration = endTime - node.startTime;

  const result = {
    name: node.name,
    duration,
    children: node.children.map((child) => processTimelineNode(child)),
  };

  return result;
}

/**
 * Creates and returns a performance monitor for tracking multiple flows
 *
 * @returns {object} Performance monitor with methods to track flows
 */
export function createPerformanceMonitor() {
  const flows = new Map();
  const flowTimelines = new Map();

  return {
    /**
     * Starts tracking a performance flow
     *
     * @param {string} flowName - Name of the flow to track
     * @param {string} [category] - Optional category for grouping flows
     * @returns {string} Flow ID for referencing this flow
     */
    startFlow(flowName, category = 'default') {
      const flowId = `${category}_${flowName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      flows.set(flowId, {
        name: flowName,
        category,
        startTime: performance.now(),
        marks: new Map(),
        events: [],
      });

      flowTimelines.set(flowId, createTimeline(flowName));

      return flowId;
    },

    /**
     * Adds a mark to a flow at the current time
     *
     * @param {string} flowId - Flow ID returned from startFlow
     * @param {string} markName - Name of the mark
     * @returns {boolean} True if mark was added successfully
     */
    markFlow(flowId, markName) {
      if (!flows.has(flowId)) {
        logger.warn(`Flow ${flowId} not found`);
        return false;
      }

      const flow = flows.get(flowId);
      const markTime = performance.now();

      flow.marks.set(markName, markTime);
      flow.events.push({
        type: 'mark',
        name: markName,
        time: markTime,
        relativeTime: markTime - flow.startTime,
      });

      return true;
    },

    /**
     * Starts a span within a flow
     *
     * @param {string} flowId - Flow ID returned from startFlow
     * @param {string} spanName - Name of the span
     * @returns {boolean} True if span was started successfully
     */
    startSpan(flowId, spanName) {
      if (!flowTimelines.has(flowId)) {
        logger.warn(`Flow ${flowId} not found for starting span`);
        return false;
      }

      flowTimelines.get(flowId).startSpan(spanName);
      return true;
    },

    /**
     * Ends the current span in a flow
     *
     * @param {string} flowId - Flow ID returned from startFlow
     * @returns {number} Duration of the span or 0 if failed
     */
    endSpan(flowId) {
      if (!flowTimelines.has(flowId)) {
        logger.warn(`Flow ${flowId} not found for ending span`);
        return 0;
      }

      return flowTimelines.get(flowId).endSpan();
    },

    /**
     * Ends tracking a performance flow and returns the results
     *
     * @param {string} flowId - Flow ID returned from startFlow
     * @returns {object|null} Flow performance data or null if flow not found
     */
    endFlow(flowId) {
      if (!flows.has(flowId)) {
        logger.warn(`Flow ${flowId} not found`);
        return null;
      }

      const flow = flows.get(flowId);
      const endTime = performance.now();
      flow.endTime = endTime;
      flow.duration = endTime - flow.startTime;

      // Get timeline data if available
      if (flowTimelines.has(flowId)) {
        flow.timeline = flowTimelines.get(flowId).end();
        flowTimelines.delete(flowId);
      }

      // Calculate durations between marks
      flow.durations = {};
      let previousMark = { name: 'start', time: flow.startTime };

      // Convert marks map to sorted array
      const sortedEvents = [...flow.events].sort((a, b) => a.time - b.time);

      // Calculate durations between sequential events
      sortedEvents.forEach((event) => {
        flow.durations[`${previousMark.name}_to_${event.name}`] = event.time - previousMark.time;
        previousMark = event;
      });

      // Add final duration to end
      flow.durations[`${previousMark.name}_to_end`] = endTime - previousMark.time;

      // Get a copy of the results and clean up
      const results = { ...flow };
      flows.delete(flowId);

      logger.debug(`Flow completed: ${flow.name}`, {
        duration: flow.duration.toFixed(2) + 'ms',
        category: flow.category,
      });

      return results;
    },

    /**
     * Gets a list of all active flows
     *
     * @returns {Array<object>} Array of active flow info objects
     */
    getActiveFlows() {
      const activeFlows = [];
      for (const [flowId, flow] of flows.entries()) {
        activeFlows.push({
          id: flowId,
          name: flow.name,
          category: flow.category,
          startTime: flow.startTime,
          elapsedTime: performance.now() - flow.startTime,
        });
      }
      return activeFlows;
    },
  };
}

// Create a global performance monitor instance
const performanceMonitor = createPerformanceMonitor();

/**
 * Global function to start tracking a performance flow
 *
 * @param {string} flowName - Name of the flow to track
 * @param {string} [category] - Optional category for grouping flows
 * @returns {string} Flow ID for referencing this flow
 */
export function startFlow(flowName, category = 'default') {
  return performanceMonitor.startFlow(flowName, category);
}

/**
 * Global function to add a mark to a flow at the current time
 *
 * @param {string} flowId - Flow ID returned from startFlow
 * @param {string} markName - Name of the mark
 * @returns {boolean} True if mark was added successfully
 */
export function markFlow(flowId, markName) {
  return performanceMonitor.markFlow(flowId, markName);
}

/**
 * Global function to start a span within a flow
 *
 * @param {string} flowId - Flow ID returned from startFlow
 * @param {string} spanName - Name of the span
 * @returns {boolean} True if span was started successfully
 */
export function startSpan(flowId, spanName) {
  return performanceMonitor.startSpan(flowId, spanName);
}

/**
 * Global function to end the current span in a flow
 *
 * @param {string} flowId - Flow ID returned from startFlow
 * @returns {number} Duration of the span or 0 if failed
 */
export function endSpan(flowId) {
  return performanceMonitor.endSpan(flowId);
}

/**
 * Global function to end tracking a performance flow and returns the results
 *
 * @param {string} flowId - Flow ID returned from startFlow
 * @returns {object|null} Flow performance data or null if flow not found
 */
export function endFlow(flowId) {
  return performanceMonitor.endFlow(flowId);
}

/**
 * Global function to get all active flows
 *
 * @returns {Array<object>} Array of active flow info objects
 */
export function getActiveFlows() {
  return performanceMonitor.getActiveFlows();
}
