/**
 * Performance Measurement Utility
 * Provides tools for measuring, tracking, and analyzing performance metrics
 * for the Time Is Money extension.
 *
 * @module utils/performance
 */

import * as logger from './logger.js';

interface Mark {
  time: number;
}

interface Measurement {
  duration: number;
}

interface Statistics {
  count: number;
  total: number;
  min: number;
  max: number;
  values: number[];
}

interface StatisticsResult {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

interface FlowEvent {
  type: string;
  name: string;
  time: number;
  relativeTime: number;
}

interface Flow {
  name: string;
  category: string;
  startTime: number;
  marks: Map<string, number>;
  events: FlowEvent[];
  endTime?: number;
  duration?: number;
  timeline?: unknown;
  durations?: Record<string, number>;
}

interface TimelineNode {
  name: string;
  startTime: number;
  endTime: number | null;
  parent: TimelineNode | Timeline;
  children: TimelineNode[];
}

interface Timeline {
  name: string;
  startTime: number;
  endTime: number | null;
  children: TimelineNode[];
  currentSpan: TimelineNode | null;
  startSpan(spanName: string): TimelineNode;
  endSpan(): number;
  end(): ProcessedTimelineNode;
  getData(): ProcessedTimelineNode;
}

interface ProcessedTimelineNode {
  name: string;
  duration: number;
  children: ProcessedTimelineNode[];
}

// Performance measurements store
const measurements = {
  marks: new Map<string, number>(),
  measures: new Map<string, number>(),
};

// Performance statistics for each metric
const statistics = new Map<string, Statistics>();

/**
 * Marks the start of a performance measurement
 */
export function mark(name: string): void {
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
    const err = error as Error;
    logger.error('Error in performance mark:', err.message, err.stack);
  }
}

/**
 * Marks the end of a performance measurement and records the duration
 */
export function measure(name: string): number | null {
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
      } catch {
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
    const err = error as Error;
    logger.error('Error in performance measure:', err.message, err.stack);
    return null;
  }
}

/**
 * Updates statistical information for a measurement
 */
function updateStatistics(name: string, duration: number): void {
  if (!statistics.has(name)) {
    statistics.set(name, {
      count: 0,
      total: 0,
      min: Infinity,
      max: -Infinity,
      values: [],
    });
  }

  const stats = statistics.get(name)!;
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
 */
export function getStatistics(name: string): StatisticsResult | null {
  try {
    if (!statistics.has(name)) {
      return null;
    }

    const stats = statistics.get(name)!;
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
    const err = error as Error;
    logger.error('Error getting statistics:', err.message, err.stack);
    return null;
  }
}

/**
 * Calculates percentile value from sorted array
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

/**
 * Gets all performance statistics
 */
export function getAllStatistics(): Record<string, StatisticsResult | null> {
  const allStats: Record<string, StatisticsResult | null> = {};

  for (const [name] of statistics) {
    allStats[name] = getStatistics(name);
  }

  return allStats;
}

/**
 * Creates a high resolution timeline with nested spans
 * for detailed performance profiling
 */
export function createTimeline(name = 'main'): Timeline {
  const timeline: Timeline = {
    name,
    startTime: performance.now(),
    endTime: null,
    children: [],
    currentSpan: null,

    /**
     * Starts a new nested span in the timeline
     */
    startSpan(spanName: string): TimelineNode {
      const span: TimelineNode = {
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
     */
    endSpan(): number {
      if (!this.currentSpan) {
        logger.warn('No active span to end');
        return 0;
      }

      this.currentSpan.endTime = performance.now();
      const duration = this.currentSpan.endTime - this.currentSpan.startTime;

      // Return to parent span
      this.currentSpan = this.currentSpan.parent === this ? null : (this.currentSpan.parent as TimelineNode);

      return duration;
    },

    /**
     * Ends the timeline and returns the complete data
     */
    end(): ProcessedTimelineNode {
      // End any active spans
      while (this.currentSpan) {
        this.endSpan();
      }

      this.endTime = performance.now();
      return this.getData();
    },

    /**
     * Gets the complete timeline data with durations
     */
    getData(): ProcessedTimelineNode {
      return processTimelineNode(this);
    },
  };

  return timeline;
}

/**
 * Processes a timeline node to calculate durations and format data
 */
function processTimelineNode(node: TimelineNode | Timeline): ProcessedTimelineNode {
  const endTime = node.endTime || performance.now();
  const duration = endTime - node.startTime;

  const result: ProcessedTimelineNode = {
    name: node.name,
    duration,
    children: node.children.map((child) => processTimelineNode(child)),
  };

  return result;
}

/**
 * Creates and returns a performance monitor for tracking multiple flows
 */
export function createPerformanceMonitor() {
  const flows = new Map<string, Flow>();
  const flowTimelines = new Map<string, Timeline>();

  return {
    /**
     * Starts tracking a performance flow
     */
    startFlow(flowName: string, category = 'default'): string {
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
     */
    markFlow(flowId: string, markName: string): boolean {
      if (!flows.has(flowId)) {
        logger.warn(`Flow ${flowId} not found`);
        return false;
      }

      const flow = flows.get(flowId)!;
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
     */
    startSpan(flowId: string, spanName: string): boolean {
      if (!flowTimelines.has(flowId)) {
        logger.warn(`Flow ${flowId} not found for starting span`);
        return false;
      }

      flowTimelines.get(flowId)!.startSpan(spanName);
      return true;
    },

    /**
     * Ends the current span in a flow
     */
    endSpan(flowId: string): number {
      if (!flowTimelines.has(flowId)) {
        logger.warn(`Flow ${flowId} not found for ending span`);
        return 0;
      }

      return flowTimelines.get(flowId)!.endSpan();
    },

    /**
     * Ends tracking a performance flow and returns the results
     */
    endFlow(flowId: string): Flow | null {
      if (!flows.has(flowId)) {
        logger.warn(`Flow ${flowId} not found`);
        return null;
      }

      const flow = flows.get(flowId)!;
      const endTime = performance.now();
      flow.endTime = endTime;
      flow.duration = endTime - flow.startTime;

      // Get timeline data if available
      if (flowTimelines.has(flowId)) {
        flow.timeline = flowTimelines.get(flowId)!.end();
        flowTimelines.delete(flowId);
      }

      // Calculate durations between marks
      flow.durations = {};
      let previousMark: { name: string; time: number } = { name: 'start', time: flow.startTime };

      // Convert marks map to sorted array
      const sortedEvents = [...flow.events].sort((a, b) => a.time - b.time);

      // Calculate durations between sequential events
      sortedEvents.forEach((event) => {
        flow.durations![`${previousMark.name}_to_${event.name}`] = event.time - previousMark.time;
        previousMark = { name: event.name, time: event.time };
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
     */
    getActiveFlows(): Array<{ id: string; name: string; category: string; startTime: number; elapsedTime: number }> {
      const activeFlows: Array<{ id: string; name: string; category: string; startTime: number; elapsedTime: number }> = [];
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
 */
export function startFlow(flowName: string, category = 'default'): string {
  return performanceMonitor.startFlow(flowName, category);
}

/**
 * Global function to add a mark to a flow at the current time
 */
export function markFlow(flowId: string, markName: string): boolean {
  return performanceMonitor.markFlow(flowId, markName);
}

/**
 * Global function to start a span within a flow
 */
export function startSpan(flowId: string, spanName: string): boolean {
  return performanceMonitor.startSpan(flowId, spanName);
}

/**
 * Global function to end the current span in a flow
 */
export function endSpan(flowId: string): number {
  return performanceMonitor.endSpan(flowId);
}

/**
 * Global function to end tracking a performance flow and returns the results
 */
export function endFlow(flowId: string): Flow | null {
  return performanceMonitor.endFlow(flowId);
}

/**
 * Global function to get all active flows
 */
export function getActiveFlows(): Array<{ id: string; name: string; category: string; startTime: number; elapsedTime: number }> {
  return performanceMonitor.getActiveFlows();
}
