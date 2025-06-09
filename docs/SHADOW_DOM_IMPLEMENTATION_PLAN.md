# Shadow DOM Implementation Plan

## Overview
Implement Shadow DOM encapsulation for PriceBadge components to achieve perfect style isolation from host site CSS.

## Goals
1. **Perfect Style Isolation**: Badge styles completely protected from host site CSS
2. **Browser Compatibility**: Graceful fallback for older browsers
3. **Maintain Functionality**: Theme detection, accessibility, and interactions still work
4. **Performance**: No significant performance degradation

## Current Architecture Analysis

### Current Badge Creation Flow
1. `createPriceBadge()` → creates PriceBadge instance
2. `PriceBadge.render()` → creates DOM elements with inline styles
3. Theme detection reads host element styles
4. Styles applied via `element.style.cssText`

### Current Style Protection
- Unique class names (`tim-*`)
- High CSS specificity
- `!important` declarations for critical styles
- Defensive styling patterns

## Shadow DOM Implementation Strategy

### 1. Browser Support Strategy

```javascript
// Feature detection
const supportsShadowDOM = 'attachShadow' in Element.prototype;

class ShadowPriceBadge extends PriceBadge {
  constructor(originalPrice, timeDisplay, context) {
    super(originalPrice, timeDisplay, context);
    this.useShadowDOM = supportsShadowDOM;
  }
}
```

**Browser Support**:
- **Supported**: Chrome 53+, Firefox 63+, Safari 10+, Edge 79+
- **Fallback**: Use existing PriceBadge for older browsers

### 2. Shadow DOM Architecture

```javascript
class ShadowPriceBadge extends PriceBadge {
  render() {
    if (this.useShadowDOM) {
      return this.renderWithShadowDOM();
    } else {
      return super.render(); // Fallback to regular rendering
    }
  }

  renderWithShadowDOM() {
    // Create host element
    const host = document.createElement('span');
    host.className = 'tim-badge-host';
    
    // Attach shadow root
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Inject styles and content
    shadow.innerHTML = this.getShadowDOMContent();
    
    return host;
  }
}
```

### 3. Style Injection Strategy

**Option A: Inline Styles in Shadow DOM**
```javascript
getShadowDOMContent() {
  return `
    <style>
      :host {
        display: inline-flex;
        align-items: center;
        /* All badge styles */
      }
      .badge-content {
        /* Content styles */
      }
      svg {
        /* Icon styles */
      }
    </style>
    <div class="badge-content">
      <svg>...</svg>
      <span>${this.timeDisplay}</span>
    </div>
  `;
}
```

**Pros**: Simple, self-contained, no external dependencies
**Cons**: Styles duplicated across multiple badges

**Option B: Constructible Stylesheets** ⭐ **PREFERRED**
```javascript
class ShadowPriceBadge {
  static shadowStyleSheet = null;
  
  static getShadowStyleSheet() {
    if (!this.shadowStyleSheet) {
      this.shadowStyleSheet = new CSSStyleSheet();
      this.shadowStyleSheet.replaceSync(this.getShadowCSS());
    }
    return this.shadowStyleSheet;
  }
  
  renderWithShadowDOM() {
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [ShadowPriceBadge.getShadowStyleSheet()];
    shadow.innerHTML = this.getShadowHTML();
    return host;
  }
}
```

**Pros**: Shared stylesheets, better performance, easier maintenance
**Cons**: Requires constructible stylesheets support (Chrome 73+, Firefox 101+)

### 4. Theme Detection Challenges

**Problem**: Shadow DOM isolates styles, breaking theme detection
**Solution**: Detect theme outside Shadow DOM, pass to badge

```javascript
class ShadowPriceBadge extends PriceBadge {
  constructor(originalPrice, timeDisplay, context) {
    super(originalPrice, timeDisplay, context);
    
    // Detect theme before creating Shadow DOM
    this.hostTheme = this.detectHostTheme(context);
  }
  
  detectHostTheme(context) {
    // Theme detection logic (existing)
    return detectTheme(context);
  }
  
  getShadowCSS() {
    const theme = this.hostTheme;
    return `
      :host {
        color: ${theme.textColor};
        /* Theme-aware styles */
      }
    `;
  }
}
```

### 5. Event Handling Strategy

**Events need to bubble through Shadow DOM boundary**:

```javascript
renderWithShadowDOM() {
  const shadow = host.attachShadow({ mode: 'open' });
  
  // Add event listeners to shadow content
  const badgeElement = shadow.querySelector('.badge-content');
  badgeElement.addEventListener('mouseenter', (e) => {
    // Events automatically bubble through shadow boundary
    this.handleMouseEnter(e);
  });
  
  return host;
}
```

### 6. Accessibility Considerations

**ARIA attributes need to be on host element**:
```javascript
renderWithShadowDOM() {
  const host = document.createElement('span');
  
  // ARIA attributes on host for screen readers
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', this.getAriaLabel());
  
  const shadow = host.attachShadow({ mode: 'open' });
  // Shadow content is implementation detail
  
  return host;
}
```

### 7. Tooltip Integration

**Challenge**: Tooltips positioned outside Shadow DOM
**Solution**: Render tooltip outside Shadow DOM

```javascript
class ShadowPriceBadge extends PriceBadge {
  render() {
    if (!this.useShadowDOM) {
      return super.render();
    }
    
    // Create container for both host and tooltip
    const container = document.createElement('span');
    container.className = 'tim-badge-container';
    
    // Shadow DOM host
    const host = this.createShadowHost();
    container.appendChild(host);
    
    // Tooltip outside Shadow DOM
    if (this.settings.showTooltip) {
      const tooltip = this.createTooltip();
      container.appendChild(tooltip);
    }
    
    return container;
  }
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup
1. Create `ShadowPriceBadge` class extending `PriceBadge`
2. Implement browser feature detection
3. Add Shadow DOM creation with fallback
4. Basic style injection (inline styles)

### Phase 2: Style System Integration
1. Implement constructible stylesheets approach
2. Update theme detection for Shadow DOM
3. Ensure all existing styles work in Shadow DOM
4. Test style isolation

### Phase 3: Event & Accessibility
1. Implement event handling through Shadow DOM
2. Ensure accessibility attributes work correctly
3. Test screen reader compatibility
4. Implement tooltip positioning

### Phase 4: Integration & Testing
1. Update PriceBadge factory to use ShadowPriceBadge
2. Add feature flag for Shadow DOM usage
3. Comprehensive testing across browsers
4. Performance benchmarking

## Risk Mitigation

### Browser Compatibility
- **Risk**: 15-20% of users may not support Shadow DOM
- **Mitigation**: Graceful fallback to existing implementation
- **Detection**: `'attachShadow' in Element.prototype`

### Performance Impact
- **Risk**: Additional DOM overhead
- **Mitigation**: Shared stylesheets, minimal Shadow DOM usage
- **Monitoring**: Performance instrumentation

### Accessibility Regression
- **Risk**: Screen readers may not handle Shadow DOM well
- **Mitigation**: Keep ARIA attributes on host element
- **Testing**: Screen reader testing in multiple browsers

### Style Conflicts
- **Risk**: Theme detection may break
- **Mitigation**: Detect theme before Shadow DOM creation
- **Fallback**: Cache theme data, use sensible defaults

## Success Criteria
1. **Style Isolation**: No host site CSS affects badge appearance
2. **Browser Support**: Works in 95%+ of target browsers
3. **Performance**: < 5% performance impact vs current implementation
4. **Accessibility**: Maintains current accessibility features
5. **Compatibility**: All existing themes and features work

## Testing Strategy
1. **Unit Tests**: Shadow DOM creation, style injection, fallback
2. **Integration Tests**: Full badge rendering with Shadow DOM
3. **Cross-Browser Tests**: All supported browsers
4. **Visual Regression**: Ensure badges look identical
5. **Accessibility Tests**: Screen reader compatibility
6. **Performance Tests**: Benchmark creation/destruction

## Rollout Strategy
1. **Feature Flag**: `useShadowDOM: false` by default
2. **Gradual Rollout**: A/B test with subset of users
3. **Monitoring**: Track performance and error metrics
4. **Fallback**: Quick disable if issues found