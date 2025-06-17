import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import Sidebar from '@/components/Sidebar';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/dashboard',
  }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('Sidebar', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items', () => {
    render(<Sidebar isOpen={true} isMobile={false} onClose={mockOnClose} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Budgeting')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
    expect(screen.getByText('Fraud Alerts')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<Sidebar isOpen={true} isMobile={false} onClose={mockOnClose} />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-primary');
  });

  it('shows mobile overlay when open on mobile', () => {
    render(<Sidebar isOpen={true} isMobile={true} onClose={mockOnClose} />);
    
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('does not show overlay on desktop', () => {
    render(<Sidebar isOpen={true} isMobile={false} onClose={mockOnClose} />);
    
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(overlay).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked on mobile', () => {
    render(<Sidebar isOpen={true} isMobile={true} onClose={mockOnClose} />);
    
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('shows close button on mobile', () => {
    render(<Sidebar isOpen={true} isMobile={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Flowlet')).toBeInTheDocument();
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked on mobile', () => {
    render(<Sidebar isOpen={true} isMobile={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('is hidden when isOpen is false', () => {
    render(<Sidebar isOpen={false} isMobile={false} onClose={mockOnClose} />);
    
    const sidebar = document.querySelector('.transform.transition-transform');
    expect(sidebar).toHaveClass('-translate-x-64');
  });

  it('is visible when isOpen is true', () => {
    render(<Sidebar isOpen={true} isMobile={false} onClose={mockOnClose} />);
    
    const sidebar = document.querySelector('.transform.transition-transform');
    expect(sidebar).toHaveClass('translate-x-0');
  });
});

