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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user?.user as User | undefined,
    isLoading,
    isAuthenticated: !!user?.user && !error,
    isAdmin: user?.user?.role === 'admin',
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}