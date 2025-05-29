/**
 * Price Patterns Library
 * Enhanced pattern matching for real-world price formats
 */

/**
 * Match space variation patterns (272.46 €, €14,32, etc.)
 *
 * @param {string} text - Text to analyze
 * @returns {Array} Array of pattern matches
 */
export function matchSpaceVariations(text) {
  if (!text || typeof text !== 'string') return [];

  const matches = [];

  // Pattern 1: Number space currency (272.46 €)
  const spaceBeforeMatches = text.matchAll(/(\d+(?:[.,]\d{2,3})?)\s+([€£¥$])/g);
  for (const match of spaceBeforeMatches) {
    matches.push({
      value: normalizeDecimal(match[1]),
      currency: match[2],
      confidence: 0.85,
      pattern: 'space-before-currency',
      original: match[0],
    });
  }

  // Pattern 2: Currency number (596.62€)
  const noSpaceAfterMatches = text.matchAll(/(\d+(?:[.,]\d{2,3})?)(€|£|¥|\$)/g);
  for (const match of noSpaceAfterMatches) {
    // Skip if this was already matched by space-before pattern
    const alreadyMatched = matches.some((m) => m.original === match[0]);
    if (!alreadyMatched) {
      matches.push({
        value: normalizeDecimal(match[1]),
        currency: match[2],
        confidence: 0.8,
        pattern: 'no-space-after-currency',
        original: match[0],
      });
    }
  }

  // Pattern 3: Currency space number (€ 14,32) AND currency number without space (€89,99)
  const spaceAfterMatches = text.matchAll(/([€£¥$])\s*(\d+(?:[.,]\d{2,3})?)/g);
  for (const match of spaceAfterMatches) {
    // Skip if this was already matched by other patterns
    const alreadyMatched = matches.some((m) => m.original === match[0]);
    if (!alreadyMatched) {
      const hasSpace = /\s/.test(match[0]);
      matches.push({
        value: normalizeDecimal(match[2]),
        currency: match[1],
        confidence: hasSpace ? 0.85 : 0.75,
        pattern: hasSpace ? 'space-after-currency' : 'no-space-after-currency',
        original: match[0],
      });
    }
  }

  return matches;
}

/**
 * Match and reconstruct split component patterns
 *
 * @param {Array} parts - Array of text parts to analyze
 * @returns {Array} Array of reconstructed price matches
 */
export function matchSplitComponents(parts) {
  if (!Array.isArray(parts) || parts.length < 2) return [];

  const matches = [];

  // Pattern 1: Cdiscount split (449€, 00)
  if (parts.length === 2) {
    const euroSplitMatch = matchCdiscountSplit(parts);
    if (euroSplitMatch) matches.push(euroSplitMatch);
  }

  // Pattern 2: Multi-part split ($, 25, .99)
  if (parts.length >= 3) {
    const multiPartMatch = matchMultiPartSplit(parts);
    if (multiPartMatch) matches.push(multiPartMatch);
  }

  // Pattern 3: Currency code split (USD, 100.00)
  if (parts.length === 2) {
    const currencyCodeMatch = matchCurrencyCodeSplit(parts);
    if (currencyCodeMatch) matches.push(currencyCodeMatch);
  }

  // Pattern 4: Ambiguous split (449, €, 00)
  if (parts.length === 3) {
    const ambiguousMatch = matchAmbiguousSplit(parts);
    if (ambiguousMatch) matches.push(ambiguousMatch);
  }

  return matches;
}

/**
 * Match contextual phrase patterns (Under $X, from $Y)
 *
 * @param {string} text - Text to analyze
 * @returns {Array} Array of contextual price matches
 */
export function matchContextualPhrases(text) {
  if (!text || typeof text !== 'string') return [];

  const matches = [];

  // Pattern 1: From $X (collect first for consistent ordering)
  const fromMatches = text.matchAll(/from\s+([€£¥$])\s*(\d+(?:\.\d{2})?)/gi);
  for (const match of fromMatches) {
    matches.push({
      value: match[2],
      currency: match[1],
      confidence: 0.9, // Higher confidence for contextual patterns
      pattern: 'from-minimum',
      context: 'from',
      original: match[0],
      position: match.index, // Add position for stable ordering
    });
  }

  // Pattern 2: Under $X
  const underMatches = text.matchAll(/under\s+([€£¥$])\s*(\d+(?:\.\d{2})?)/gi);
  for (const match of underMatches) {
    matches.push({
      value: match[2],
      currency: match[1],
      confidence: 0.9, // Higher confidence for contextual patterns
      pattern: 'under-maximum',
      context: 'under',
      original: match[0],
      position: match.index, // Add position for stable ordering
    });
  }

  // Pattern 3: Starting at X
  const startingAtMatches = text.matchAll(/starting\s+at\s+([€£¥$¥])\s*(\d+(?:\.\d{2})?)/gi);
  for (const match of startingAtMatches) {
    matches.push({
      value: match[2],
      currency: match[1],
      confidence: 0.88, // High confidence for contextual patterns
      pattern: 'starting-at-minimum',
      context: 'starting-at',
      original: match[0],
      position: match.index,
    });
  }

  // Sort by position in text for consistent ordering
  matches.sort((a, b) => (a.position || 0) - (b.position || 0));

  return matches;
}

/**
 * Match large number patterns with thousand separators
 *
 * @param {string} text - Text to analyze
 * @returns {Array} Array of large number matches
 */
export function matchLargeNumbers(text) {
  if (!text || typeof text !== 'string') return [];

  const matches = [];

  // Pattern 1: Comma thousands ($2,500,000)
  const commaThousandsMatches = text.matchAll(/([€£¥$])(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g);
  for (const match of commaThousandsMatches) {
    const normalizedValue = match[2].replace(/,/g, '');
    // Only match if it's actually a large number (>= 1000)
    if (parseFloat(normalizedValue) >= 1000) {
      matches.push({
        value: normalizedValue,
        currency: match[1],
        confidence: 0.9,
        pattern: 'comma-thousands',
        original: match[0],
      });
    }
  }

  // Pattern 2: Dot thousands (€1.234.567)
  const dotThousandsMatches = text.matchAll(/([€£¥$])(\d{1,3}(?:\.\d{3})+)/g);
  for (const match of dotThousandsMatches) {
    const normalizedValue = match[2].replace(/\./g, '');
    if (parseFloat(normalizedValue) >= 1000) {
      matches.push({
        value: normalizedValue,
        currency: match[1],
        confidence: 0.85,
        pattern: 'dot-thousands',
        original: match[0],
      });
    }
  }

  // Pattern 3: Space thousands (£1 234 567)
  const spaceThousandsMatches = text.matchAll(/([€£¥$])(\d{1,3}(?:\s\d{3})+)/g);
  for (const match of spaceThousandsMatches) {
    const normalizedValue = match[2].replace(/\s/g, '');
    if (parseFloat(normalizedValue) >= 1000) {
      matches.push({
        value: normalizedValue,
        currency: match[1],
        confidence: 0.8,
        pattern: 'space-thousands',
        original: match[0],
      });
    }
  }

  return matches;
}

/**
 * Select the best pattern match from text
 *
 * @param {string} text - Text to analyze
 * @param {object} context - Context hints for pattern selection
 * @returns {object|null} Best matching pattern or null
 */
export function selectBestPattern(text, context = {}) {
  if (!text || typeof text !== 'string') return null;

  const allMatches = [];

  // Handle split components if context provided
  if (context.splitComponents && Array.isArray(context.parts)) {
    allMatches.push(...matchSplitComponents(context.parts));
  } else if (context.splitComponents && typeof text === 'string') {
    // Try to split the text for Cdiscount-style patterns
    const cdiscountMatch = text.match(/(\d+€)\s+(\d{2})/);
    if (cdiscountMatch) {
      const parts = [cdiscountMatch[1], cdiscountMatch[2]];
      allMatches.push(...matchSplitComponents(parts));
    }
  }

  // Try contextual patterns first (highest priority)
  allMatches.push(...matchContextualPhrases(text));

  // Then specialized patterns
  allMatches.push(...matchLargeNumbers(text));

  // Always try basic patterns for standard formats (high confidence)
  allMatches.push(...matchBasicPatterns(text));

  // Finally try space variations (lower priority)
  allMatches.push(...matchSpaceVariations(text));

  // Remove duplicates based on original text match
  const uniqueMatches = [];
  const seen = new Set();

  for (const match of allMatches) {
    const key = `${match.original}-${match.pattern}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(match);
    }
  }

  // Sort by confidence and return best match
  uniqueMatches.sort((a, b) => b.confidence - a.confidence);

  return uniqueMatches.length > 0 ? uniqueMatches[0] : null;
}

/**
 * Validate pattern match accuracy
 *
 * @param {object} match - Pattern match to validate
 * @param {string} originalText - Original text that was matched
 * @returns {boolean} True if match is valid
 */
export function validatePatternMatch(match, originalText) {
  if (!match || !originalText) return false;

  // Check if original match text exists in the original text
  if (match.original && !originalText.includes(match.original)) {
    return false;
  }

  // Check if currency and value are reasonable
  if (!match.currency || !match.value) return false;

  // Validate value is a number
  if (isNaN(parseFloat(match.value))) return false;

  return true;
}

/**
 * Normalize price format to standard decimal notation
 *
 * @param {string} rawPrice - Raw price string
 * @param {string} format - Format hint ('european', 'us', 'french', etc.)
 * @returns {string|null} Normalized price or null
 */
export function normalizePrice(rawPrice, format = 'auto') {
  if (!rawPrice || typeof rawPrice !== 'string') return null;

  // Handle empty or invalid input
  if (rawPrice.trim() === '' || !/\d/.test(rawPrice)) return null;

  let normalized = rawPrice.trim();

  // Auto-detect format if not specified
  if (format === 'auto') {
    format = detectPriceFormat(normalized);
  }

  // Apply format-specific normalization
  switch (format) {
    case 'european': // 1.234,56
      normalized = normalized.replace(/\./g, '').replace(',', '.');
      break;
    case 'french': // 1 234,56
      normalized = normalized.replace(/\s/g, '').replace(',', '.');
      break;
    case 'us': // 1,234.56
    default:
      normalized = normalized.replace(/,/g, '');
      break;
  }

  // Validate final result
  if (isNaN(parseFloat(normalized))) return null;

  return normalized;
}

// Helper Functions

/**
 * Normalize decimal separator to dot
 *
 * @param {string} value - Price value with potential comma decimal separator
 * @returns {string} Price value with dot decimal separator
 */
function normalizeDecimal(value) {
  return value.replace(',', '.');
}

/**
 * Detect price format from text patterns
 *
 * @param {string} text - Text to analyze for price format
 * @returns {string} Format type ('european', 'french', or 'us')
 */
function detectPriceFormat(text) {
  // European format: uses comma for decimal
  if (/\d+,\d{2}$/.test(text) && !/\d+\.\d{3}/.test(text)) {
    return 'european';
  }

  // French format: uses spaces for thousands
  if (/\d+\s\d{3}/.test(text)) {
    return 'french';
  }

  // Default to US format
  return 'us';
}

/**
 * Match Cdiscount split format (449€, 00)
 *
 * @param {Array} parts - Array of price parts to analyze
 * @returns {object|null} Match object or null if no match
 */
function matchCdiscountSplit(parts) {
  if (parts.length !== 2) return null;

  const [first, second] = parts;
  const euroMatch = first.match(/(\d+)(€|£|¥|\$)/);
  const centsMatch = second.match(/^(\d{2})$/);

  if (euroMatch && centsMatch) {
    return {
      value: `${euroMatch[1]}.${centsMatch[1]}`,
      currency: euroMatch[2],
      confidence: 0.95,
      pattern: 'cdiscount-split',
      parts: parts,
      reconstructed: `${first} ${second}`,
    };
  }

  return null;
}

/**
 * Match multi-part split ($, 25, .99)
 *
 * @param {Array} parts - Array of price parts to analyze
 * @returns {object|null} Match object or null if no match
 */
function matchMultiPartSplit(parts) {
  if (parts.length < 3) return null;

  // Look for currency symbol in first part
  const currencyMatch = parts[0].match(/^([€£¥$])$/);
  if (!currencyMatch) return null;

  // Try to reconstruct number from remaining parts
  const numberParts = parts.slice(1).join('');
  const valueMatch = numberParts.match(/^(\d+(?:\.\d{2})?)$/);

  if (valueMatch) {
    return {
      value: valueMatch[1],
      currency: currencyMatch[1],
      confidence: 0.8,
      pattern: 'multi-part-split',
      parts: parts,
      reconstructed: parts.join(''),
    };
  }

  return null;
}

/**
 * Match currency code split (USD, 100.00)
 *
 * @param {Array} parts - Array of price parts to analyze
 * @returns {object|null} Match object or null if no match
 */
function matchCurrencyCodeSplit(parts) {
  if (parts.length !== 2) return null;

  const [first, second] = parts;
  const codeMatch = first.match(/^(USD|EUR|GBP|JPY)$/i);
  const valueMatch = second.match(/^(\d+(?:\.\d{2})?)$/);

  if (codeMatch && valueMatch) {
    return {
      value: valueMatch[1],
      currency: codeMatch[1].toUpperCase(),
      confidence: 0.85,
      pattern: 'currency-code-split',
      parts: parts,
      reconstructed: `${first} ${second}`,
    };
  }

  return null;
}

/**
 * Match basic standard price patterns
 *
 * @param {string} text - Text to analyze for basic price patterns
 * @returns {Array} Array of basic pattern matches
 */
function matchBasicPatterns(text) {
  const matches = [];

  // Standard format: $100.00, €25.99, etc.
  const standardMatches = text.matchAll(/([€£¥$])(\d+(?:\.\d{2})?)/g);
  for (const match of standardMatches) {
    matches.push({
      value: match[2],
      currency: match[1],
      confidence: 0.85, // Increase confidence for standard patterns
      pattern: 'standard-format',
      original: match[0],
    });
  }

  return matches;
}

/**
 * Handle ambiguous split patterns like ['449', '€', '00']
 *
 * @param {Array} parts - Array of price parts to analyze
 * @returns {object|null} Match object or null if no match
 */
function matchAmbiguousSplit(parts) {
  if (parts.length !== 3) return null;

  const [first, second, third] = parts;

  // Pattern: number, currency, cents (449, €, 00)
  if (/^\d+$/.test(first) && /^[€£¥$]$/.test(second) && /^\d{2}$/.test(third)) {
    return {
      value: `${first}.${third}`,
      currency: second,
      confidence: 0.9,
      pattern: 'ambiguous-split',
      parts: parts,
      reconstructed: `${first}${second} ${third}`,
    };
  }

  return null;
}
