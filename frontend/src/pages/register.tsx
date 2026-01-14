'use client';

import React from 'react';
import Register from '@/components/containers/auth/Register';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';

const RegisterPage: React.FC = () => {
  const locale = useLocaleShort();

  const { ui } = useUiSection('ui_auth', locale as any);

  // Layout kaldırıldığı için şimdilik sadece hesaplanıyor (istersen next/head ile basarız)
  void ui('ui_auth_register_meta_title', 'Sign Up | konigsmassage');
  void ui('ui_auth_register_meta_description', 'Create your konigsmassage account.');

  return <Register />;
};

export default RegisterPage;
