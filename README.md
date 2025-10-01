# Funding Rate Radar

A real-time cryptocurrency funding rate monitoring application with value context comparisons.

## Features

### 📊 Funding Rate Monitoring
- **Real-time data** from 6 major exchanges (Binance, Bybit, Hyperliquid, Lighter, Extended, Aster)
- **Interactive table** with sorting by APR, absolute APR, and negatives first
- **Quick filters** for negative rates and upcoming funding periods
- **Asset & exchange filtering** with persistent state
- **Sparkline charts** showing 24h funding rate history
- **Expandable rows** with detailed funding information

### 💰 Value Context
- **Cost comparisons** - see how much your PnL covers in real-world terms
- **Smart item selection** - automatically shows relevant comparisons
- **Number formatting** - comma-separated thousands for better readability
- **Color-coded results** - amber for gains, akane for losses, kori for neutral
- **PnL card generation** - download beautiful shareable images
- **Increment buttons** - quick adjustments from -20k to +20k
- **Filter by frequency** - one-off, monthly, or annual expenses

### 🎨 Enhanced UX
- **Bilingual interface** - English labels with Japanese katakana sublabels
- **Glass morphism design** with pixelated Fuji mountain background
- **Sticky mini-calculator** when scrolling out of view
- **Keyboard navigation** - arrow keys for amount adjustment
- **Debounced calculations** for smooth performance
- **Tooltips and microcopy** for better usability
- **Responsive design** that works on all screen sizes

### 🖼️ PnL Card Generation
- **Preview dialog** - see your card before downloading
- **Professional design** - glass morphism with FujiScan branding
- **Bilingual labels** - English and Japanese katakana sublabels
- **Proper aspect ratios** - maintains logo proportions
- **High-quality PNG** - perfect for sharing on social media

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Custom CSS** for glass morphism effects
- **Real-time API** integration with multiple exchanges

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/achillesbro/funding-rate-radar.git
   cd funding-rate-radar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /api/funding` - Fetches real-time funding rate data from all exchanges

## Configuration

The application supports multiple exchanges and assets. Configuration can be found in:
- `src/lib/symbols.ts` - Supported assets and exchanges
- `src/lib/exchanges/` - Exchange-specific API implementations
- `src/app/data/costs.ts` - Default cost items for value context

## Design Philosophy

This application combines the precision of financial data with the aesthetic of Japanese tech culture. The bilingual interface (English/Japanese) provides accessibility while maintaining cultural authenticity through carefully chosen katakana terminology.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the precision and aesthetics of Japanese financial technology
- Built with modern web technologies for optimal performance
- Designed for both casual users and professional traders