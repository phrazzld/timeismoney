/**
 * Performance Analysis Utility
 * Analyzes performance test results and generates comprehensive reports
 *
 * @module performance/performance-analyzer
 */

// Performance analysis utility - no external dependencies needed

/**
 * Analyzes performance test results against baseline metrics
 *
 * @param {object} performanceData - Test results from performance validation
 * @returns {object} Analysis report with recommendations
 */
export function analyzePerformanceResults(performanceData) {
  const analysis = {
    summary: {},
    baseline: {},
    enhanced: {},
    comparison: {},
    recommendations: [],
    compliance: {},
  };

  // TASK-002 baseline expectations are used in thresholds below

  // Acceptable thresholds (10% tolerance from baseline)
  const ACCEPTABLE_THRESHOLDS = {
    textProcessing: 1.1, // 10% over baseline
    pageProcessing: 220, // 10% over 200ms baseline
    domExtraction: 5.0, // New capability - acceptable cost
    debugOverhead: 50, // 50% max overhead for debug mode
    memoryUsage: 1024 * 1024, // 1MB max increase
  };

  // Analyze baseline performance
  analysis.baseline = {
    shortText: performanceData.baseline?.short || {},
    mediumText: performanceData.baseline?.medium || {},
    largeText: performanceData.baseline?.large || {},
    patternCompilation: performanceData.baseline?.patternCompilation || {},
  };

  // Analyze enhanced system performance
  analysis.enhanced = {
    textProcessing: {
      short: performanceData.enhanced?.short || {},
      medium: performanceData.enhanced?.medium || {},
      large: performanceData.enhanced?.large || {},
    },
    domExtraction: performanceData.enhanced?.domExtractions || {},
    multiPass: {
      earlyExit: performanceData.enhanced?.['multiPass_Early exit'] || {},
      fullPipeline: performanceData.enhanced?.['multiPass_Full pipeline'] || {},
      contextual: performanceData.enhanced?.['multiPass_Contextual patterns'] || {},
    },
    memory: performanceData.enhanced?.memoryUsage || {},
    debug: performanceData.enhanced?.debugImpact || {},
    pageSimulation: performanceData.enhanced?.pageSimulation || {},
  };

  // Generate performance comparison
  analysis.comparison = generateComparison(analysis.baseline, analysis.enhanced);

  // Check compliance against thresholds
  analysis.compliance = checkCompliance(analysis.enhanced, ACCEPTABLE_THRESHOLDS);

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis.enhanced, analysis.compliance);

  // Generate summary
  analysis.summary = generateSummary(analysis.compliance, analysis.comparison);

  return analysis;
}

/**
 * Generates comparison metrics between baseline and enhanced systems
 *
 * @param {object} baseline - Baseline performance measurements
 * @param {object} enhanced - Enhanced system performance measurements
 * @returns {object} Comparison metrics with change percentages
 */
function generateComparison(baseline, enhanced) {
  const comparison = {};

  // Compare text processing performance
  ['short', 'medium', 'large'].forEach((size) => {
    if (baseline[size + 'Text'] && enhanced.textProcessing[size]) {
      const baselineAvg = baseline[size + 'Text'].avgDuration || 0;
      const enhancedAvg = enhanced.textProcessing[size].avgDuration || 0;

      comparison[size + 'Text'] = {
        baseline: baselineAvg,
        enhanced: enhancedAvg,
        change: enhancedAvg - baselineAvg,
        changePercent: baselineAvg > 0 ? ((enhancedAvg - baselineAvg) / baselineAvg) * 100 : 0,
        withinThreshold: enhancedAvg <= baselineAvg * 1.1,
      };
    }
  });

  return comparison;
}

/**
 * Checks performance compliance against defined thresholds
 *
 * @param {object} enhanced - Enhanced system performance data
 * @param {object} thresholds - Performance threshold definitions
 * @returns {object} Compliance analysis with pass/fail status
 */
function checkCompliance(enhanced, thresholds) {
  const compliance = {
    overall: true,
    details: {},
  };

  // Check text processing compliance
  Object.entries(enhanced.textProcessing).forEach(([size, data]) => {
    const avgDuration = data.avgDuration || 0;
    const threshold =
      thresholds.textProcessing * (size === 'large' ? 2.0 : size === 'medium' ? 0.5 : 0.1);

    compliance.details[`textProcessing_${size}`] = {
      value: avgDuration,
      threshold,
      compliant: avgDuration <= threshold,
      metric: 'Average duration (ms)',
    };

    if (!compliance.details[`textProcessing_${size}`].compliant) {
      compliance.overall = false;
    }
  });

  // Check DOM extraction compliance
  if (enhanced.domExtraction && Object.keys(enhanced.domExtraction).length > 0) {
    const domExtractionTimes = Object.values(enhanced.domExtraction).map((d) => d.avgDuration || 0);
    const maxDomTime = Math.max(...domExtractionTimes);

    compliance.details.domExtraction = {
      value: maxDomTime,
      threshold: thresholds.domExtraction,
      compliant: maxDomTime <= thresholds.domExtraction,
      metric: 'Max DOM extraction time (ms)',
    };

    if (!compliance.details.domExtraction.compliant) {
      compliance.overall = false;
    }
  }

  // Check page simulation compliance
  if (enhanced.pageSimulation?.totalDuration) {
    compliance.details.pageProcessing = {
      value: enhanced.pageSimulation.totalDuration,
      threshold: thresholds.pageProcessing,
      compliant: enhanced.pageSimulation.totalDuration <= thresholds.pageProcessing,
      metric: 'Page processing time (ms)',
    };

    if (!compliance.details.pageProcessing.compliant) {
      compliance.overall = false;
    }
  }

  // Check debug overhead compliance
  if (enhanced.debug?.overheadPercent !== undefined) {
    compliance.details.debugOverhead = {
      value: enhanced.debug.overheadPercent,
      threshold: thresholds.debugOverhead,
      compliant: enhanced.debug.overheadPercent <= thresholds.debugOverhead,
      metric: 'Debug overhead (%)',
    };

    if (!compliance.details.debugOverhead.compliant) {
      compliance.overall = false;
    }
  }

  // Check memory usage compliance
  if (enhanced.memory?.memoryDelta) {
    compliance.details.memoryUsage = {
      value: enhanced.memory.memoryDelta,
      threshold: thresholds.memoryUsage,
      compliant: enhanced.memory.memoryDelta <= thresholds.memoryUsage,
      metric: 'Memory increase (bytes)',
    };

    if (!compliance.details.memoryUsage.compliant) {
      compliance.overall = false;
    }
  }

  return compliance;
}

/**
 * Generates performance optimization recommendations
 *
 * @param {object} enhanced - Enhanced system performance data
 * @param {object} compliance - Compliance analysis results
 * @returns {Array} List of performance recommendations
 */
function generateRecommendations(enhanced, compliance) {
  const recommendations = [];

  // Check for performance issues and generate recommendations
  if (!compliance.details.pageProcessing?.compliant) {
    recommendations.push({
      priority: 'high',
      category: 'optimization',
      issue: 'Page processing time exceeds threshold',
      recommendation: 'Optimize DOM traversal algorithms and implement early exit strategies',
      impact: 'User experience',
    });
  }

  if (!compliance.details.domExtraction?.compliant) {
    recommendations.push({
      priority: 'medium',
      category: 'optimization',
      issue: 'DOM extraction time is high for complex structures',
      recommendation: 'Cache DOM analysis results and optimize element traversal',
      impact: 'Complex price detection performance',
    });
  }

  if (!compliance.details.debugOverhead?.compliant) {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      issue: 'Debug mode overhead is high',
      recommendation: 'Optimize debug logging frequency and use conditional logging',
      impact: 'Development and debugging performance',
    });
  }

  // Generate positive recommendations for good performance
  if (compliance.overall) {
    recommendations.push({
      priority: 'info',
      category: 'validation',
      issue: 'All performance metrics within acceptable bounds',
      recommendation:
        'Monitor performance in production and establish continuous performance testing',
      impact: 'Long-term maintainability',
    });
  }

  // Check multi-pass efficiency
  if (enhanced.multiPass?.earlyExit && enhanced.multiPass?.fullPipeline) {
    const earlyExitTime = enhanced.multiPass.earlyExit.avgDuration || 0;
    const fullPipelineTime = enhanced.multiPass.fullPipeline.avgDuration || 0;

    if (fullPipelineTime > earlyExitTime * 3) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        issue: 'Full pipeline is significantly slower than early exit',
        recommendation:
          'Optimize later pipeline passes and implement more aggressive early exit conditions',
        impact: 'Performance for complex/failed detections',
      });
    }
  }

  return recommendations;
}

/**
 * Generates executive summary of performance analysis
 *
 * @param {object} compliance - Compliance analysis results
 * @param {object} comparison - Performance comparison data
 * @returns {object} Executive summary with overall status and findings
 */
function generateSummary(compliance, comparison) {
  const summary = {
    overall: compliance.overall ? 'PASS' : 'NEEDS_OPTIMIZATION',
    score: 0,
    keyFindings: [],
    riskLevel: 'low',
  };

  // Calculate compliance score
  const compliantCount = Object.values(compliance.details).filter((d) => d.compliant).length;
  const totalCount = Object.keys(compliance.details).length;
  summary.score = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100;

  // Determine risk level
  if (summary.score < 70) {
    summary.riskLevel = 'high';
  } else if (summary.score < 85) {
    summary.riskLevel = 'medium';
  }

  // Generate key findings
  if (compliance.overall) {
    summary.keyFindings.push('Enhanced price detection system meets all performance requirements');
    summary.keyFindings.push(
      'DOM-based extraction provides new capabilities without significant performance impact'
    );
  } else {
    const nonCompliantItems = Object.entries(compliance.details)
      .filter(([, data]) => !data.compliant)
      .map(([key, data]) => `${key}: ${data.value.toFixed(2)} ${data.metric}`);

    summary.keyFindings.push(`Performance issues found: ${nonCompliantItems.join(', ')}`);
  }

  // Add comparison insights
  Object.entries(comparison).forEach(([key, data]) => {
    if (data.changePercent > 10) {
      summary.keyFindings.push(`${key} performance decreased by ${data.changePercent.toFixed(1)}%`);
    } else if (data.changePercent < -5) {
      summary.keyFindings.push(
        `${key} performance improved by ${Math.abs(data.changePercent).toFixed(1)}%`
      );
    }
  });

  return summary;
}

/**
 * Formats performance analysis as a structured report
 *
 * @param {object} analysis - Performance analysis results
 * @returns {object} Structured performance report with timestamp
 */
export function formatPerformanceReport(analysis) {
  const report = {
    title: 'Performance Validation Report - TASK-015',
    timestamp: new Date().toISOString(),
    summary: analysis.summary,
    compliance: analysis.compliance,
    recommendations: analysis.recommendations,
    detailedMetrics: {
      baseline: analysis.baseline,
      enhanced: analysis.enhanced,
      comparison: analysis.comparison,
    },
  };

  return report;
}

/**
 * Converts performance analysis to markdown format for documentation
 *
 * @param {object} analysis - Performance analysis results
 * @returns {string} Markdown-formatted performance report
 */
export function generateMarkdownReport(analysis) {
  const report = formatPerformanceReport(analysis);

  let markdown = `# Performance Validation Report - TASK-015\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n\n`;

  // Executive Summary
  markdown += `## Executive Summary\n\n`;
  markdown += `- **Overall Result:** ${report.summary.overall}\n`;
  markdown += `- **Compliance Score:** ${report.summary.score}%\n`;
  markdown += `- **Risk Level:** ${report.summary.riskLevel.toUpperCase()}\n\n`;

  markdown += `### Key Findings\n\n`;
  report.summary.keyFindings.forEach((finding) => {
    markdown += `- ${finding}\n`;
  });
  markdown += `\n`;

  // Compliance Details
  markdown += `## Compliance Analysis\n\n`;
  markdown += `| Metric | Value | Threshold | Status |\n`;
  markdown += `|--------|-------|-----------|--------|\n`;

  Object.entries(report.compliance.details).forEach(([key, data]) => {
    const status = data.compliant ? '✅ PASS' : '❌ FAIL';
    const value = typeof data.value === 'number' ? data.value.toFixed(2) : data.value;
    const threshold =
      typeof data.threshold === 'number' ? data.threshold.toFixed(2) : data.threshold;
    markdown += `| ${key} | ${value} | ${threshold} | ${status} |\n`;
  });
  markdown += `\n`;

  // Recommendations
  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;

    ['high', 'medium', 'low', 'info'].forEach((priority) => {
      const priorityRecs = report.recommendations.filter((r) => r.priority === priority);
      if (priorityRecs.length > 0) {
        markdown += `### ${priority.toUpperCase()} Priority\n\n`;
        priorityRecs.forEach((rec) => {
          markdown += `**${rec.issue}**\n`;
          markdown += `- *Recommendation:* ${rec.recommendation}\n`;
          markdown += `- *Impact:* ${rec.impact}\n\n`;
        });
      }
    });
  }

  return markdown;
}
