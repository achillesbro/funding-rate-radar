# Deployment Guide - Vercel

This guide will help you deploy the Funding Rate Radar application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Node.js**: Version 18+ recommended

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `achillesbro/funding-rate-radar`

2. **Configure Build Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Environment Variables** (if needed)
   - No environment variables required for this deployment
   - All API keys are handled client-side for public exchanges

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-3 minutes)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd funding-radar
   vercel
   ```

4. **Follow Prompts**
   - Link to existing project or create new one
   - Confirm build settings
   - Deploy

## Configuration Files

The project includes optimized configuration for Vercel:

### `vercel.json`
- Sets build command and output directory
- Configures API function timeouts (30s for funding data)
- Adds CORS headers for API routes
- Optimizes caching for API endpoints

### `next.config.js`
- Enables standalone output for better performance
- Configures image optimization
- Sets up API route caching headers
- Optimizes package imports for Recharts

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces bundle size and deployment time

## Performance Optimizations

### API Routes
- **Caching**: 60-second cache with 120s stale-while-revalidate
- **Timeout**: 30-second timeout for external API calls
- **CORS**: Proper headers for cross-origin requests

### Build Optimizations
- **Standalone Output**: Reduces bundle size
- **Package Optimization**: Optimizes Recharts imports
- **Image Optimization**: Enabled for better performance

### Runtime Optimizations
- **SWR**: Client-side caching with 60-second deduplication
- **Debounced Inputs**: Reduces API calls from user input
- **Memoized Components**: Prevents unnecessary re-renders

## Post-Deployment

### Domain Configuration
1. **Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Environment Variables** (if needed later)
   - Project Settings → Environment Variables
   - Add any required API keys or configuration

### Monitoring
- **Analytics**: Available in Vercel dashboard
- **Function Logs**: Monitor API route performance
- **Build Logs**: Track deployment success/failures

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `next.config.js` syntax
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

2. **API Route Timeouts**
   - External exchange APIs may be slow
   - Consider implementing retry logic
   - Monitor function logs in Vercel dashboard

3. **Image Loading Issues**
   - Verify all images are in `/public` directory
   - Check image paths in components
   - Ensure proper file permissions

### Performance Issues

1. **Slow API Responses**
   - Check external exchange API status
   - Monitor Vercel function logs
   - Consider implementing request queuing

2. **Large Bundle Size**
   - Run `npm run build` locally to check bundle size
   - Use Vercel's bundle analyzer
   - Optimize imports and remove unused dependencies

## Maintenance

### Regular Updates
- Monitor exchange API changes
- Update dependencies monthly
- Check Vercel dashboard for any alerts

### Scaling Considerations
- Vercel automatically handles scaling
- Monitor function invocations and limits
- Consider upgrading to Pro plan for higher limits

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Project Issues**: Create issues in GitHub repository

---

Your Funding Rate Radar is now live and ready to monitor cryptocurrency funding rates with beautiful value context comparisons! 🚀
