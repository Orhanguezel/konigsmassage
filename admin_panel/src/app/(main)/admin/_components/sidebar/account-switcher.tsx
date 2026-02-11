'use client';

// =============================================================
// FILE: src/app/(main)/dashboard/_components/sidebar/account-switcher.tsx
// Panel – Account menu (minimal: user info + logout)
// =============================================================

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';

import { useLogoutMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type Me = {
  id: string;
  email: string | null;
  role: string;
};

export function AccountSwitcher({ me }: { me: Me }) {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const t = useAdminT();

  const displayName = useMemo(() => me.email ?? 'Admin', [me.email]);

  async function onLogout() {
    try {
      await logout().unwrap();
    } catch {
      // logout fail olsa bile login'e gönder
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-lg">
          <AvatarImage src={undefined} alt={displayName} />
          <AvatarFallback className="rounded-lg">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-64 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="px-3 py-2">
          <div className="text-sm font-semibold truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate">{me.role}</div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <User className="mr-2 size-4" />
          <span className="truncate">{me.email ?? 'admin'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout} disabled={isLoading}>
          <LogOut className="mr-2 size-4" />
          {t('admin.sidebar.user.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
