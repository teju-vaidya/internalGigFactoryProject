import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      profile: null,
      isProfileLoading: false,
      profileError: null,

      // Public settings & maintenance state
      maintenanceMode: false,
      maintenanceMessage: '',
      sessionTimeoutMins: 60,
      platformName: 'GigFactory',
      supportEmail: 'support@gigfactory.in',
      termsUrl: '',
      privacyUrl: '',

      setMaintenance: (active, message) => {
        set({ maintenanceMode: active, maintenanceMessage: message || '' });
      },

      fetchPublicSettings: async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const response = await fetch(`${baseUrl}/auth/public-settings`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              set({
                platformName: data.platformName,
                supportEmail: data.supportEmail,
                termsUrl: data.termsUrl || '',
                privacyUrl: data.privacyUrl || '',
                sessionTimeoutMins: data.sessionTimeoutMins,
                maintenanceMode: data.maintenanceMode,
                maintenanceMessage: data.maintenanceMessage,
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch public settings:", error);
        }
      },

      setAuth: (token, refreshToken, user) => {
        set({ token, refreshToken, user });
        // Defensive double-writing to keep raw localStorage in sync for any legacy files
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      },

      clearAuth: () => {
        set({ token: null, refreshToken: null, user: null, profile: null, profileError: null });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...userData };
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },

      setProfile: (profile) => {
        set({ profile });
      },

      fetchProfile: async () => {
        const { token, user } = get();
        if (!token || !user) return;
        const role = user.role || 'gig_expert';
        if (role === 'admin') return;
        
        set({ isProfileLoading: true, profileError: null });
        try {
          const { api } = await import('../utils/api');
          const response = await api.get(`/profiles/${role}`);
          if (response && response.success) {
            set({ profile: response.profile, isProfileLoading: false });
          } else {
            set({ isProfileLoading: false, profileError: 'Failed to retrieve profile.' });
          }
        } catch (error) {
          set({ isProfileLoading: false, profileError: error.message || 'Error loading profile.' });
        }
      },

      updateProfile: async (profileData) => {
        const { user } = get();
        if (!user) return;
        const role = user.role || 'gig_expert';
        
        try {
          const { api } = await import('../utils/api');
          const response = await api.put(`/profiles/${role}`, profileData);
          if (response && response.success) {
            set({ profile: response.profile });
            return { success: true };
          } else {
            return { success: false, error: response?.message || 'Failed to update profile.' };
          }
        } catch (error) {
          const errMsg = error.message || 'Error updating profile.';
          return { success: false, error: errMsg };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Hydrate Zustand from initial values, only persisting specific fields
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
