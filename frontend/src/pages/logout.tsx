'use client';

import React from 'react';
import Logout from '@/components/containers/auth/Logout';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const LogoutPage: React.FC = () => {
  const locale = useLocaleShort();

  const { ui } = useUiSection('ui_auth', locale as any);

  // Layout kaldırıldığı için şimdilik sadece hesaplanıyor (istersen next/head ile basarız)
  void ui('ui_auth_logout_meta_title', 'Signing out | konigsmassage');
  void ui('ui_auth_logout_meta_description', 'Signing you out of your konigsmassage account.');

  return <Logout />;
};

export default LogoutPage;
