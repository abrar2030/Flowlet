import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import Header from '@/components/Header';
import { mockUser } from '@/test/utils';

// Mock the hooks
vi.mock('@/hooks/redux', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => ({
    theme: 'system',
    unreadNotifications: 3,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

vi.mock('@/store/authSlice', () => ({
  logoutUser: vi.fn(),
}));

vi.mock('@/store/uiSlice', () => ({
  setTheme: vi.fn(),
}));

describe('Header', () => {
  const mockOnMenuClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with Flowlet branding', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    expect(screen.getByText('Flowlet')).toBeInTheDocument();
  });

  it('shows mobile badge when on mobile', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={true} />);

    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  it('does not show mobile badge on desktop', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    const menuButton = screen.getByRole('button', { name: '' }); // Menu icon button
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('displays notification badge with count', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays user avatar with initials', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
  });

  it('opens user menu when avatar is clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    const avatarButton = screen.getByRole('button', { name: '' }); // Avatar button
    fireEvent.click(avatarButton);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows theme options in user menu', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    const avatarButton = screen.getByRole('button', { name: '' });
    fireEvent.click(avatarButton);

    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('shows logout option in user menu', () => {
    render(<Header onMenuClick={mockOnMenuClick} isMobile={false} />);

    const avatarButton = screen.getByRole('button', { name: '' });
    fireEvent.click(avatarButton);

    expect(screen.getByText('Log out')).toBeInTheDocument();
  });
});
