import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamStats,
  TeamState,
  TeamAction,
  TeamRole,
  InviteMemberData,
  RolePermissions,
} from '../types/settings';
import { checkPermission } from '../lib/permissions';

// Initial state
const initialState: TeamState = {
  team: null,
  members: [],
  invitations: [],
  stats: {
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    availableSeats: 0,
    maxSeats: 5,
  },
  currentUserRole: null,
  isLoading: true,
  error: null,
};

// Reducer function
function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case 'SET_TEAM':
      return {
        ...state,
        team: action.payload,
      };
    case 'SET_MEMBERS':
      return {
        ...state,
        members: action.payload,
      };
    case 'ADD_MEMBER':
      return {
        ...state,
        members: [...state.members, action.payload],
      };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      };
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload),
      };
    case 'SET_INVITATIONS':
      return {
        ...state,
        invitations: action.payload,
      };
    case 'ADD_INVITATION':
      return {
        ...state,
        invitations: [...state.invitations, action.payload],
      };
    case 'UPDATE_INVITATION':
      return {
        ...state,
        invitations: state.invitations.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      };
    case 'REMOVE_INVITATION':
      return {
        ...state,
        invitations: state.invitations.filter((i) => i.id !== action.payload),
      };
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
      };
    case 'SET_CURRENT_USER_ROLE':
      return {
        ...state,
        currentUserRole: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

// Mock data generators
function generateMockTeam(): Team {
  return {
    id: 'team-1',
    name: 'Acme Corporation',
    ownerId: 'user-1',
    maxSeats: 10,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };
}

function generateMockMembers(): TeamMember[] {
  const now = new Date();
  return [
    {
      id: 'member-1',
      teamId: 'team-1',
      userId: 'user-1',
      email: 'john.smith@acme.com',
      name: 'John Smith',
      avatarUrl: undefined,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      lastActiveAt: now,
    },
    {
      id: 'member-2',
      teamId: 'team-1',
      userId: 'user-2',
      email: 'sarah.jones@acme.com',
      name: 'Sarah Jones',
      avatarUrl: undefined,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'member-3',
      teamId: 'team-1',
      userId: 'user-3',
      email: 'mike.wilson@acme.com',
      name: 'Mike Wilson',
      avatarUrl: undefined,
      role: 'member',
      status: 'active',
      joinedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'member-4',
      teamId: 'team-1',
      userId: 'user-4',
      email: 'emma.brown@acme.com',
      name: 'Emma Brown',
      avatarUrl: undefined,
      role: 'member',
      status: 'active',
      joinedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'member-5',
      teamId: 'team-1',
      userId: 'user-5',
      email: 'alex.taylor@acme.com',
      name: 'Alex Taylor',
      avatarUrl: undefined,
      role: 'viewer',
      status: 'inactive',
      joinedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
  ];
}

function generateMockInvitations(): TeamInvitation[] {
  const now = new Date();
  return [
    {
      id: 'invite-1',
      teamId: 'team-1',
      email: 'new.user@example.com',
      role: 'member',
      invitedBy: { id: 'user-1', name: 'John Smith' },
      message: 'Welcome to the team!',
      token: 'token-abc123',
      status: 'pending',
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'invite-2',
      teamId: 'team-1',
      email: 'contractor@external.com',
      role: 'viewer',
      invitedBy: { id: 'user-2', name: 'Sarah Jones' },
      token: 'token-def456',
      status: 'pending',
      expiresAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];
}

function calculateStats(members: TeamMember[], invitations: TeamInvitation[], maxSeats: number): TeamStats {
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const pendingInvites = invitations.filter((i) => i.status === 'pending').length;
  return {
    totalMembers: members.length,
    activeMembers,
    pendingInvites,
    availableSeats: maxSeats - members.length - pendingInvites,
    maxSeats,
  };
}

// Context interface
interface TeamContextValue {
  state: TeamState;
  // Actions
  inviteMembers: (data: InviteMemberData) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  changeRole: (memberId: string, newRole: TeamRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  deactivateMember: (memberId: string) => Promise<void>;
  reactivateMember: (memberId: string) => Promise<void>;
  // Helpers
  canInvite: () => boolean;
  canManageMember: (member: TeamMember) => boolean;
  hasPermission: (permission: keyof import('../types/settings').RolePermissions) => boolean;
}

// Create context
const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// Provider props
interface TeamProviderProps {
  children: React.ReactNode;
}

// Provider component
export function TeamProvider({ children }: TeamProviderProps) {
  const [state, dispatch] = useReducer(teamReducer, initialState);

  // Load initial data on mount
  useEffect(() => {
    const loadTeamData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const team = generateMockTeam();
        const members = generateMockMembers();
        const invitations = generateMockInvitations();
        const stats = calculateStats(members, invitations, team.maxSeats);

        dispatch({ type: 'SET_TEAM', payload: team });
        dispatch({ type: 'SET_MEMBERS', payload: members });
        dispatch({ type: 'SET_INVITATIONS', payload: invitations });
        dispatch({ type: 'SET_STATS', payload: stats });
        // Set current user as owner for demo
        dispatch({ type: 'SET_CURRENT_USER_ROLE', payload: 'owner' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load team data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadTeamData();
  }, []);

  // Recalculate stats when members or invitations change
  useEffect(() => {
    if (state.team) {
      const stats = calculateStats(state.members, state.invitations, state.team.maxSeats);
      dispatch({ type: 'SET_STATS', payload: stats });
    }
  }, [state.members, state.invitations, state.team]);

  const inviteMembers = useCallback(async (data: InviteMemberData) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const now = new Date();
      const newInvitations: TeamInvitation[] = data.emails.map((email, index) => ({
        id: `invite-new-${Date.now()}-${index}`,
        teamId: state.team?.id || 'team-1',
        email,
        role: data.role,
        invitedBy: { id: 'user-1', name: 'John Smith' },
        message: data.message,
        token: `token-${Math.random().toString(36).substring(7)}`,
        status: 'pending' as const,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        createdAt: now,
      }));

      newInvitations.forEach((invitation) => {
        dispatch({ type: 'ADD_INVITATION', payload: invitation });
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send invitations' });
      throw error;
    }
  }, [state.team?.id]);

  const resendInvitation = useCallback(async (invitationId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const now = new Date();
      dispatch({
        type: 'UPDATE_INVITATION',
        payload: {
          id: invitationId,
          updates: {
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            createdAt: now,
          },
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to resend invitation' });
      throw error;
    }
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: 'REMOVE_INVITATION', payload: invitationId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to cancel invitation' });
      throw error;
    }
  }, []);

  const changeRole = useCallback(async (memberId: string, newRole: TeamRole) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({
        type: 'UPDATE_MEMBER',
        payload: { id: memberId, updates: { role: newRole } },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to change role' });
      throw error;
    }
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: 'REMOVE_MEMBER', payload: memberId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove member' });
      throw error;
    }
  }, []);

  const deactivateMember = useCallback(async (memberId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({
        type: 'UPDATE_MEMBER',
        payload: { id: memberId, updates: { status: 'inactive' } },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to deactivate member' });
      throw error;
    }
  }, []);

  const reactivateMember = useCallback(async (memberId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({
        type: 'UPDATE_MEMBER',
        payload: { id: memberId, updates: { status: 'active' } },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reactivate member' });
      throw error;
    }
  }, []);

  const canInvite = useCallback(() => {
    const { currentUserRole, stats } = state;
    if (!currentUserRole) return false;
    const roleHierarchy: TeamRole[] = ['owner', 'admin'];
    return roleHierarchy.includes(currentUserRole) && stats.availableSeats > 0;
  }, [state]);

  const canManageMember = useCallback((member: TeamMember) => {
    const { currentUserRole } = state;
    if (!currentUserRole) return false;

    // Can't manage yourself
    if (member.userId === 'user-1') return false;

    // Owner can manage everyone except themselves
    if (currentUserRole === 'owner') return true;

    // Admin can manage members and viewers
    if (currentUserRole === 'admin') {
      return member.role === 'member' || member.role === 'viewer';
    }

    return false;
  }, [state]);

  const hasPermission = useCallback((permission: keyof RolePermissions) => {
    const { currentUserRole } = state;
    return checkPermission(currentUserRole, permission).allowed;
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      inviteMembers,
      resendInvitation,
      cancelInvitation,
      changeRole,
      removeMember,
      deactivateMember,
      reactivateMember,
      canInvite,
      canManageMember,
      hasPermission,
    }),
    [
      state,
      inviteMembers,
      resendInvitation,
      cancelInvitation,
      changeRole,
      removeMember,
      deactivateMember,
      reactivateMember,
      canInvite,
      canManageMember,
      hasPermission,
    ]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// Custom hook to use the team context
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

// Export context for testing purposes
export { TeamContext };
