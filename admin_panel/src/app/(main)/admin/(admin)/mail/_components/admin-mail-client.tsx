'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/mail/admin-mail-client.tsx
// FINAL — Admin Mail Test
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Send, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useSendTestMailMutation } from '@/integrations/hooks';

export default function AdminMailClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.mail ?? {};
  const common = copy.common;

  const [sendTestMail, { isLoading }] = useSendTestMailMutation();
  const [email, setEmail] = React.useState('');

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      await sendTestMail({ to: email }).unwrap();
      toast.success(page?.test_mail_sent || 'Test mail sent successfully');
      setEmail('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || common?.states?.error || 'Failed to send test mail';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {page?.title || 'Mail Test'}
          </h1>
          <p className="text-muted-foreground">
            {page?.subtitle || 'Send test emails to verify SMTP configuration'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {page?.test_section_title || 'Send Test Email'}
          </CardTitle>
          <CardDescription>
            {page?.test_section_description || 'Enter an email address to send a test email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {page?.email_label || 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={page?.email_placeholder || 'test@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading
                ? (page?.sending || 'Sending...')
                : (page?.send_test || 'Send Test Email')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{page?.info_title || 'SMTP Configuration'}</CardTitle>
          <CardDescription>
            {page?.info_description || 'Test emails use your current SMTP settings from environment variables'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {page?.info_line1 || 'Check your SMTP configuration in .env file:'}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>SMTP_HOST</li>
            <li>SMTP_PORT</li>
            <li>SMTP_USER</li>
            <li>SMTP_PASS</li>
            <li>MAIL_FROM</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
