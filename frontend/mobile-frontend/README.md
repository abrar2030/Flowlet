# Flowlet Mobile Frontend

A modern, responsive mobile-first financial application built with React, featuring advanced offline capabilities, push notifications, and smooth animations.

## 🚀 Features

### ✅ Completed Features

- **Modern React Architecture**: Built with React 18+ and modern hooks
- **Responsive Design**: Mobile-first approach with desktop compatibility
- **Dark/Light Theme Support**: Automatic theme switching with user preferences
- **State Management**: Efficient state management using Zustand
- **Navigation System**: React Router with protected routes
- **Authentication**: Login, register, and biometric authentication
- **KYC Integration**: Complete onboarding flow with identity verification
- **Wallet Dashboard**: Real-time balance and transaction overview
- **Transaction Management**: History, filtering, and detailed views
- **Money Transfer**: Send and receive money with QR codes
- **Card Management**: Virtual and physical card controls
- **Financial Analytics**: Comprehensive spending insights and charts
- **AI Chatbot**: Intelligent financial assistant
- **Fraud Detection**: Real-time security alerts and monitoring
- **Security Settings**: Comprehensive security controls
- **Push Notifications**: Real-time notifications for transactions and alerts
- **Offline Support**: Full offline functionality with data synchronization
- **Performance Optimization**: Lazy loading, virtual scrolling, and caching
- **Smooth Animations**: Micro-interactions and page transitions

## 🛠 Technology Stack

- **Frontend Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Offline Storage**: IndexedDB
- **Service Worker**: Custom implementation for offline support
- **Package Manager**: pnpm

## 📁 Project Structure

```
flowlet-mobile/
├── public/
│   ├── sw.js                 # Service Worker for offline support
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── wallet/          # Wallet and transaction components
│   │   ├── cards/           # Card management components
│   │   ├── analytics/       # Financial analytics components
│   │   ├── ai/              # AI chatbot and fraud detection
│   │   ├── security/        # Security and settings components
│   │   ├── common/          # Shared components
│   │   └── ui/              # UI components and animations
│   ├── hooks/
│   │   ├── index.js         # Authentication and theme hooks
│   │   ├── useNotifications.js  # Push notification management
│   │   ├── useOffline.js    # Offline functionality
│   │   └── usePerformance.js    # Performance optimization
│   ├── services/
│   │   ├── api.js           # API service layer
│   │   ├── constants.js     # Application constants
│   │   ├── notificationService.js   # Push notification service
│   │   ├── offlineStorageService.js # IndexedDB offline storage
│   │   └── performanceService.js    # Performance monitoring
│   ├── store/
│   │   └── useUIStore.js    # Global UI state management
│   ├── App.jsx              # Main application component
│   ├── App.css              # Global styles
│   └── main.jsx             # Application entry point
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abrar2030/Flowlet.git
   cd Flowlet/frontend/mobile-frontend/flowlet-mobile
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm run build
```

### Preview Production Build

```bash
pnpm run preview
```

## 📱 Key Features Implementation

### Push Notifications

The application includes a comprehensive push notification system:

- **Service Worker Integration**: Background notification handling
- **Permission Management**: User-friendly permission requests
- **Notification Types**: Transaction alerts, security warnings, card updates
- **Offline Queuing**: Notifications queued when offline and delivered when online

```javascript
import { useNotifications } from './hooks/useNotifications';

const { subscribe, sendTransactionNotification } = useNotifications();

// Subscribe to notifications
await subscribe();

// Send transaction notification
sendTransactionNotification({
  type: 'credit',
  amount: 100,
  counterparty: 'John Doe'
});
```

### Offline Support

Full offline functionality with data synchronization:

- **IndexedDB Storage**: Local data persistence
- **Action Queuing**: Offline actions synced when online
- **Cache Management**: Intelligent caching with TTL
- **Background Sync**: Automatic synchronization when connection restored

```javascript
import { useOffline } from './hooks/useOffline';

const { storeOfflineAction, getCachedTransactions } = useOffline();

// Store action for offline execution
await storeOfflineAction('transfer', { amount: 50, recipient: 'user123' });

// Get cached transactions
const transactions = await getCachedTransactions();
```

### Performance Optimization

Advanced performance features for smooth user experience:

- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient rendering of large lists
- **Image Optimization**: Automatic image optimization
- **Resource Preloading**: Critical resource preloading
- **Performance Monitoring**: Real-time performance metrics

```javascript
import { useLazyLoading, useVirtualScrolling } from './hooks/usePerformance';

// Lazy load component
const { elementRef, isLoaded } = useLazyLoading('TransactionList', () => 
  import('./TransactionList')
);

// Virtual scrolling for large lists
const { containerRef, visibleItems } = useVirtualScrolling(
  transactions, 
  60, // item height
  400  // container height
);
```

### Smooth Animations

Rich animation system with micro-interactions:

- **Page Transitions**: Smooth navigation between screens
- **Micro-interactions**: Button presses, hover effects
- **Loading States**: Engaging loading animations
- **Gesture Feedback**: Visual feedback for user interactions

```javascript
import { AnimatedContainer, AnimatedButton } from './components/ui/animations';

<AnimatedContainer variant={fadeInUp}>
  <AnimatedButton onClick={handleClick}>
    Transfer Money
  </AnimatedButton>
</AnimatedContainer>
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_BASE_URL=https://api.flowlet.com
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key
REACT_APP_ENVIRONMENT=development
```

### PWA Configuration

The application is configured as a Progressive Web App (PWA):

- **Service Worker**: Handles offline functionality and push notifications
- **Web App Manifest**: Enables installation on mobile devices
- **Offline First**: Core functionality available offline

## 🧪 Testing

### Running Tests

```bash
pnpm run test
```

### Test Coverage

```bash
pnpm run test:coverage
```

## 📊 Performance Metrics

The application includes built-in performance monitoring:

- **Load Time**: Page load performance
- **Render Time**: Component render performance
- **Memory Usage**: JavaScript heap usage
- **Core Web Vitals**: LCP, FID, CLS metrics

## 🔒 Security Features

- **Biometric Authentication**: Fingerprint and face recognition
- **Fraud Detection**: Real-time transaction monitoring
- **Security Alerts**: Immediate notification of suspicious activity
- **Data Encryption**: All sensitive data encrypted
- **Secure Storage**: Encrypted local storage for sensitive information

## 📱 Mobile Optimization

- **Touch Gestures**: Swipe, pinch, and tap interactions
- **Responsive Design**: Optimized for all screen sizes
- **Native Feel**: App-like experience on mobile devices
- **Offline First**: Core functionality available without internet
- **Fast Loading**: Optimized bundle size and lazy loading

## 🚀 Deployment

### Vercel Deployment

```bash
pnpm run build
vercel --prod
```

### Netlify Deployment

```bash
pnpm run build
netlify deploy --prod --dir=dist
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "preview"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Email**: support@flowlet.com
- **Documentation**: [docs.flowlet.com](https://docs.flowlet.com)
- **Issues**: [GitHub Issues](https://github.com/abrar2030/Flowlet/issues)

## 🎯 Roadmap

### Upcoming Features

- [ ] Biometric authentication integration
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Investment portfolio tracking
- [ ] Bill payment automation
- [ ] Merchant payment integration
- [ ] Voice commands
- [ ] AR/VR features

### Performance Improvements

- [ ] Bundle size optimization
- [ ] Advanced caching strategies
- [ ] Server-side rendering (SSR)
- [ ] Edge computing integration

---

**Built with ❤️ by the Flowlet Team**

