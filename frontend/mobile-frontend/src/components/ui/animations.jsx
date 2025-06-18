import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for common patterns
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' }
};

export const slideInFromTop = {
  initial: { opacity: 0, y: '-100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' }
};

// Stagger animation for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, x: 300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 }
};

export const modalTransition = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

// Button animation variants
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 }
};

// Card animation variants
export const cardHover = {
  y: -5,
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  transition: { duration: 0.3 }
};

// Loading animation variants
export const loadingSpinner = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

export const loadingPulse = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Notification animation variants
export const notificationSlide = {
  initial: { opacity: 0, x: 300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 }
};

// Enhanced Animation Components
export const AnimatedContainer = ({ children, variant = fadeInUp, ...props }) => (
  <motion.div
    variants={variant}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
);

export const AnimatedList = ({ children, ...props }) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    {...props}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div key={index} variants={staggerItem}>
        {child}
      </motion.div>
    ))}
  </motion.div>
);

export const AnimatedButton = ({ children, onClick, disabled, className, ...props }) => (
  <motion.button
    whileHover={!disabled ? buttonHover : {}}
    whileTap={!disabled ? buttonTap : {}}
    onClick={onClick}
    disabled={disabled}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);

export const AnimatedCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={cardHover}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const PageTransition = ({ children, ...props }) => (
  <motion.div
    variants={pageTransition}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    {...props}
  >
    {children}
  </motion.div>
);

export const ModalTransition = ({ children, isOpen, ...props }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        variants={modalTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const LoadingSpinner = ({ size = 24, className = '' }) => (
  <motion.div
    variants={loadingSpinner}
    animate="animate"
    className={`inline-block border-2 border-current border-t-transparent rounded-full ${className}`}
    style={{ width: size, height: size }}
  />
);

export const LoadingPulse = ({ children, className = '' }) => (
  <motion.div
    variants={loadingPulse}
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

export const NotificationToast = ({ children, isVisible, ...props }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        variants={notificationSlide}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Micro-interaction components
export const PressableArea = ({ children, onPress, className, ...props }) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onTap={onPress}
    className={`cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export const HoverCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ 
      scale: 1.02,
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
      transition: { duration: 0.2 }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const FloatingActionButton = ({ children, onClick, className, ...props }) => (
  <motion.button
    whileHover={{ 
      scale: 1.1,
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`rounded-full ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);

// Progress animation
export const ProgressBar = ({ progress, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <motion.div
      className="bg-blue-600 h-2 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  </div>
);

// Count up animation
export const CountUp = ({ from = 0, to, duration = 1, className = '' }) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ textContent: from }}
        animate={{ textContent: to }}
        transition={{ duration, ease: 'easeOut' }}
        onUpdate={(latest) => {
          if (typeof latest.textContent === 'number') {
            latest.textContent = Math.round(latest.textContent);
          }
        }}
      />
    </motion.span>
  );
};

