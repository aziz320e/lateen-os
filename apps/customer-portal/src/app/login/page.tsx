'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/lib/api/client';

const schema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Customer Portal</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your Identity Service account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" {...register('username')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('rememberMe')} /> Remember me
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            Dev mode: set LATEEN_CUSTOMER_ID to browse without login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
