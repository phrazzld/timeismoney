# Time Is Money 💰⌛

[![CI](https://github.com/phrazzld/timeismoney/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/phrazzld/timeismoney/actions/workflows/ci.yml?query=branch%3Amaster)

Time Is Money is a Chrome extension that automatically converts prices online into hours of work, helping you make better-informed purchasing decisions by understanding the true value of your time.

## Features ✨

- **Smart Price Detection**: Advanced DOM-first analysis with multi-pass detection pipeline
- **Site-Specific Optimization**: Specialized handlers for Amazon, eBay, Cdiscount, Gearbest, and more
- **Complex Format Support**: Handles split prices, nested elements, aria-labels, and contextual prices
- **Multi-Currency Support**: Global currency detection with symbols, codes, and regional formats
- **Real-Time Conversion**: Automatically converts detected prices to hours of work based on your wage
- **Performance Optimized**: Efficient detection with minimal impact on page load times

### Enhanced Price Detection System

- **DOM Structure Analysis**: Extracts prices from complex HTML structures and attributes
- **Pattern Matching**: Recognizes diverse price formats including "Under $X", "From $X", and split components
- **Fallback Strategies**: Multiple detection passes ensure maximum accuracy across different sites
- **Context Awareness**: Understands e-commerce page context for better price identification
- **Debug Mode**: Comprehensive logging for troubleshooting and optimization

## Featured On 🌟

- [Yahoo News](https://finance.yahoo.com/news/time-is-money-chrome-extension-tells-you-how-many-102539694524.html)
- [Lifehacker](https://lifehacker.com/time-is-money-shows-you-prices-in-terms-of-hours-worked-1657631655)
- [Huffington Post](https://www.huffpost.com/entry/time-is-money_b_6981806)
- [Fast Company](https://www.fastcompany.com/3038475/by-turning-minutes-into-moolah-this-chrome-extension-helps-you-save)
- [Free Technology for Teachers](https://www.freetech4teachers.com/2014/11/time-is-money-chrome-extension-that.html#.VHDu11fF8b5)
- [Cheapism](https://blog.cheapism.com/time-is-money-chrome-extension/)

## Usage 🚀

1. Download the Time Is Money extension for Google Chrome [here](https://chrome.google.com/webstore/detail/time-is-money/ooppbnomdcjmoepangldchpmjhkeendl).
2. Configure the extension with your hourly wage and preferred currency settings.
3. Browse the web as usual, and watch prices automatically convert into hours of work.

## Technical Architecture 🏗️

### Multi-Pass Detection Pipeline

The enhanced price detection system uses a sophisticated multi-pass approach:

1. **Pass 1**: Site-specific handlers (highest confidence)
2. **Pass 2**: DOM attribute extraction (aria-label, data-\*)
3. **Pass 3**: DOM structure analysis (split components)
4. **Pass 4**: Enhanced pattern matching on extracted text
5. **Pass 5**: Contextual patterns ("Under $X", "from $X")

### Core Components

- **`priceExtractor.js`**: Unified extraction pipeline with strategy coordination
- **`domPriceAnalyzer.js`**: DOM structure analysis and attribute extraction
- **`siteHandlers.js`**: Site-specific optimization for major e-commerce platforms
- **`pricePatterns.js`**: Advanced pattern library for diverse price formats

### Pattern Configuration

The system supports flexible pattern configuration through:

- **Text Patterns**: Regular expression-based matching for standard formats
- **DOM Patterns**: Structure-aware extraction from complex HTML layouts
- **Site Handlers**: Custom logic for specific website requirements
- **Contextual Patterns**: Understanding of pricing context and terminology

For detailed documentation, see [`docs/patterns/`](docs/patterns/) directory.

## Contribute 🤝

We welcome contributions to Time Is Money! If you have ideas for new features, bug fixes, or other improvements, please feel free to submit a pull request or create an issue. Your input and collaboration are highly appreciated.

Please follow our [Contributing Guidelines](docs/development/CONTRIBUTING.md), [Testing Guidelines](docs/development/TESTING_GUIDE.md), and [Versioning Guidelines](docs/development/VERSIONING.md) when making contributions to this project. We use Conventional Commits and Semantic Versioning to maintain a clear project history and versioning scheme.

## License ⚖️

[MIT](https://opensource.org/licenses/MIT)
