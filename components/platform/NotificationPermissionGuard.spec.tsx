import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { NotificationPermissionGuard } from './NotificationPermissionGuard';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getUser: jest.fn(),
  },
}));

describe('NotificationPermissionGuard Suite', () => {
  const originalNotification = window.Notification;

  beforeEach(() => {
    jest.clearAllMocks();
    (api.getUser as jest.Mock).mockReturnValue({
      id: 'usr_operator_1',
      role: 'CENTRE',
      username: 'madurai_operator',
    });
  });

  afterEach(() => {
    window.Notification = originalNotification;
  });

  // =========================================================================
  // 1. Granted Permission Test Case
  // =========================================================================
  it('allows access and renders protected child content when permission is GRANTED', () => {
    window.Notification = {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted'),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Welcome to Protected Dashboard</div>
      </NotificationPermissionGuard>
    );

    expect(screen.getByTestId('protected-dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Browser Notifications Required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notifications Are Blocked/i)).not.toBeInTheDocument();
  });

  // =========================================================================
  // 2. Default Permission State - Mandatory Prompt Screen
  // =========================================================================
  it('blocks access and renders mandatory permission screen when permission is DEFAULT', () => {
    window.Notification = {
      permission: 'default',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Secret Dashboard</div>
      </NotificationPermissionGuard>
    );

    // Child must NOT be rendered
    expect(screen.queryByTestId('protected-dashboard')).not.toBeInTheDocument();

    // Mandatory prompt UI must be visible
    expect(screen.getByRole('heading', { name: /Browser Notifications Required/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enable Notifications/i })).toBeInTheDocument();
  });

  // =========================================================================
  // 3. User Clicks Enable -> Requesting -> Grants Permission -> Dashboard Unlocks
  // =========================================================================
  it('requests permission on button click and unlocks dashboard when granted', async () => {
    let resolvePermission: (perm: NotificationPermission) => void;
    const requestPromise = new Promise<NotificationPermission>((resolve) => {
      resolvePermission = resolve;
    });

    const mockRequest = jest.fn().mockImplementation(() => requestPromise);

    window.Notification = {
      permission: 'default',
      requestPermission: mockRequest,
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Dashboard Now Open</div>
      </NotificationPermissionGuard>
    );

    const enableButton = screen.getByRole('button', { name: /Enable Notifications/i });
    fireEvent.click(enableButton);

    expect(mockRequest).toHaveBeenCalledTimes(1);

    // In requesting state
    expect(screen.getByText(/Waiting for browser permission/i)).toBeInTheDocument();

    // Browser resolves with 'granted'
    await act(async () => {
      (window.Notification as any).permission = 'granted';
      resolvePermission('granted');
    });

    await waitFor(() => {
      expect(screen.getByTestId('protected-dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Browser Notifications Required/i)).not.toBeInTheDocument();
  });

  // =========================================================================
  // 4. User Denies Permission -> Dashboard Blocked with Chrome/Edge instructions
  // =========================================================================
  it('blocks access and displays blocked screen with manual instructions when user denies', async () => {
    const mockRequest = jest.fn().mockResolvedValue('denied');

    window.Notification = {
      permission: 'default',
      requestPermission: mockRequest,
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Secret Page</div>
      </NotificationPermissionGuard>
    );

    const enableButton = screen.getByRole('button', { name: /Enable Notifications/i });
    await act(async () => {
      fireEvent.click(enableButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Notifications Are Blocked/i })).toBeInTheDocument();
    });

    expect(screen.queryByTestId('protected-dashboard')).not.toBeInTheDocument();
    expect(screen.getByText(/Google Chrome/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft Edge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Again/i })).toBeInTheDocument();
  });

  // =========================================================================
  // 5. Permission Already Denied on Mount
  // =========================================================================
  it('immediately blocks protected content when permission is already DENIED on mount', () => {
    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Never Seen</div>
      </NotificationPermissionGuard>
    );

    expect(screen.queryByTestId('protected-dashboard')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Notifications Are Blocked/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument();

    // Must NEVER auto-call requestPermission when already denied
    expect(window.Notification.requestPermission).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 6. User Changes Settings to Granted -> Restores Access on Recheck
  // =========================================================================
  it('restores access when user updates settings to granted and clicks "Check Again"', async () => {
    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Unlocked After Check</div>
      </NotificationPermissionGuard>
    );

    expect(screen.getByRole('heading', { name: /Notifications Are Blocked/i })).toBeInTheDocument();

    // User updates site settings in browser to 'granted'
    (window.Notification as any).permission = 'granted';

    const checkAgainButton = screen.getByRole('button', { name: /Check Again/i });
    fireEvent.click(checkAgainButton);

    await waitFor(() => {
      expect(screen.getByTestId('protected-dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: /Notifications Are Blocked/i })).not.toBeInTheDocument();
  });

  // =========================================================================
  // 7. Auto-Revalidation on Window Focus / Visibility Change
  // =========================================================================
  it('automatically revalidates and unlocks when user returns to window tab after allowing', async () => {
    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Unlocked on Tab Focus</div>
      </NotificationPermissionGuard>
    );

    expect(screen.getByRole('heading', { name: /Notifications Are Blocked/i })).toBeInTheDocument();

    // User updates site settings in another tab and focuses back
    (window.Notification as any).permission = 'granted';

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('protected-dashboard')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 8. Unsupported Environment Handling
  // =========================================================================
  it('displays compatibility error when Notification API is unsupported in browser', () => {
    // Delete Notification from window to simulate unsupported browser
    // @ts-ignore
    delete window.Notification;

    render(
      <NotificationPermissionGuard>
        <div data-testid="protected-dashboard">Should not render</div>
      </NotificationPermissionGuard>
    );

    expect(screen.queryByTestId('protected-dashboard')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Browser Notifications Not Supported/i })).toBeInTheDocument();
    expect(screen.getByText(/Google Chrome/i)).toBeInTheDocument();
  });

  // =========================================================================
  // 9. Role-Based Policy: WORKER execution is exempt
  // =========================================================================
  it('exempts WORKER role completely from browser notification permission requirement', () => {
    (api.getUser as jest.Mock).mockReturnValue({
      id: 'worker_terminal_1',
      role: 'WORKER',
    });

    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard>
        <div data-testid="worker-workload">Automated Worker Running</div>
      </NotificationPermissionGuard>
    );

    // WORKER must render immediately even if notification permission is denied
    expect(screen.getByTestId('worker-workload')).toBeInTheDocument();
    expect(screen.queryByText(/Notifications Are Blocked/i)).not.toBeInTheDocument();
  });

  // =========================================================================
  // 10. Role-Based Policy: SUPER_ADMIN bypass when explicitly allowed
  // =========================================================================
  it('allows SUPER_ADMIN bypass when allowSuperAdminBypass is enabled', () => {
    (api.getUser as jest.Mock).mockReturnValue({
      id: 'admin_1',
      role: 'SUPER_ADMIN',
    });

    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard allowSuperAdminBypass={true}>
        <div data-testid="admin-panel">Admin Diagnostic Console</div>
      </NotificationPermissionGuard>
    );

    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
  });

  it('enforces notification permission for SUPER_ADMIN when allowSuperAdminBypass is false', () => {
    (api.getUser as jest.Mock).mockReturnValue({
      id: 'admin_1',
      role: 'SUPER_ADMIN',
    });

    window.Notification = {
      permission: 'denied',
      requestPermission: jest.fn(),
    } as any;

    render(
      <NotificationPermissionGuard allowSuperAdminBypass={false}>
        <div data-testid="admin-panel">Admin Diagnostic Console</div>
      </NotificationPermissionGuard>
    );

    expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Notifications Are Blocked/i })).toBeInTheDocument();
  });
});
