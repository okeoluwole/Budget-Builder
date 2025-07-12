import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null; // Return null for 401, don't throw error
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', { email, password });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const login = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: (data) => {
            resolve(data);
          },
          onError: (error) => {
            reject(error);
          },
        }
      );
    });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user?.user as User | undefined,
    isLoading,
    isAuthenticated: !!user?.user && !error,
    isAdmin: user?.user?.role === 'admin',
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}