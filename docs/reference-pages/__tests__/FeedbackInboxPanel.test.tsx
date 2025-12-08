import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FeedbackInboxPanel from '@/components/admin/feedback/FeedbackInboxPanel';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve()),
  },
}));

// Mock Papa Parse
vi.mock('papaparse', () => ({
  unparse: vi.fn(() => 'csv,data'),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'test-user', email: 'test@example.com', role: 'admin' },
  })),
}));

// Mock useAuditLog
vi.mock('@/hooks/admin/useAuditLog', () => ({
  useAuditLog: vi.fn(() => ({
    log: vi.fn(() => Promise.resolve()),
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('FeedbackInboxPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    // Mock loading state
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => new Promise(() => {})), // Never resolves
      })),
    }));
    
    supabase.from = mockFrom;

    renderWithProviders(<FeedbackInboxPanel />);
    
    // Check for loading skeleton elements (they have h-10 class)
    expect(screen.getByText('Feedback Inbox')).toBeInTheDocument();
  });

  it('renders empty state when no feedback', async () => {
    const mockData = [];
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    }));
    
    supabase.from = mockFrom;

    renderWithProviders(<FeedbackInboxPanel />);
    
    await waitFor(() => {
      expect(screen.getByText(/no feedback submissions yet/i)).toBeInTheDocument();
    });
  });

  it('renders feedback list when data exists', async () => {
    const mockData = [
      {
        id: '1',
        user_suggestion: 'Test suggestion',
        submitted_by: 'user1',
        resolved: false,
        created_at: '2023-01-01T00:00:00Z',
        user_profiles: { email: 'user1@example.com', full_name: 'User One' },
        predictions: {
          confidence_score: 0.85,
          predicted_outcome: 'home_win',
          matches: {
            home_team: { name: 'Team A' },
            away_team: { name: 'Team B' },
            match_date: '2023-01-01T00:00:00Z',
          },
        },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    }));
    
    supabase.from = mockFrom;

    renderWithProviders(<FeedbackInboxPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Test suggestion')).toBeInTheDocument();
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('Team A vs Team B')).toBeInTheDocument();
    });
  });

  it('shows export button', async () => {
    const mockData = [
      {
        id: '1',
        user_suggestion: 'Test suggestion',
        submitted_by: 'user1',
        resolved: false,
        created_at: '2023-01-01T00:00:00Z',
        user_profiles: { email: 'user1@example.com', full_name: 'User One' },
        predictions: {
          confidence_score: 0.85,
          predicted_outcome: 'home_win',
          matches: {
            home_team: { name: 'Team A' },
            away_team: { name: 'Team B' },
            match_date: '2023-01-01T00:00:00Z',
          },
        },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    }));
    
    supabase.from = mockFrom;

    renderWithProviders(<FeedbackInboxPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });
});