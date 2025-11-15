// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { checkAdminRole, AdminUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const auth = getAuth(app);

// Componente para la pantalla de carga
const AuthLoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-grow flex-col items-center justify-center gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

// Componente para el formulario de login
const LoginForm = () => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El onAuthStateChanged se encargará de la redirección
    } catch (error: any) {
      let errorMessageKey = 'login.error.invalidCredentials';
      if (
        error.code &&
        (error.code.includes('auth/user-not-found') ||
          error.code.includes('auth/wrong-password') ||
          error.code.includes('auth/invalid-credential'))
      ) {
        errorMessageKey = 'login.error.invalidCredentials';
      } else {
        errorMessageKey = 'login.error.generic';
      }
      toast({
        title: t('login.error.title'),
        description: t(errorMessageKey),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: t('login.reset.errorTitle'),
        description: t('login.reset.emailRequired'),
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: t('login.reset.successTitle'),
        description: t('login.reset.successDescription', { email }),
      });
    } catch (error: any) {
      let errorMessageKey = 'login.reset.errorGeneric';
      if (error.code === 'auth/user-not-found') {
        errorMessageKey = 'login.reset.userNotFound';
      }
      toast({
        title: t('login.reset.errorTitle'),
        description: t(errorMessageKey),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md animate-in fade-in-50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('login.passwordLabel')}</Label>
              <Button
                variant="link"
                type="button"
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="h-auto p-0 text-xs"
              >
                {t('login.forgotPassword')}
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={
                  showPassword
                    ? t('login.showPassword')
                    : t('login.showPassword')
                }
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              t('login.loginButton')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente principal de la página de login
export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('admin');
  const [status, setStatus] = useState<
    'loading' | 'unauthenticated' | 'authenticated'
  >('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setStatus('loading'); // Muestra 'cargando' mientras se verifica el rol
        try {
          // Forzar la recarga del token para obtener los últimos claims
          await user.getIdToken(true);
          const adminUser = await checkAdminRole(user);

          if (adminUser?.role) {
            toast({
              title: t('login.successTitle'),
              description: t('login.successDescription'),
            });
            router.push('/admin/dashboard');
          } else {
            toast({
              title: t('dashboard.accessDenied'),
              description: t('dashboard.noAdminRights'),
              variant: 'destructive',
            });
            await auth.signOut();
            setStatus('unauthenticated');
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          toast({
            title: t('login.error.title'),
            description: t('login.error.generic'),
            variant: 'destructive',
          });
          await auth.signOut();
          setStatus('unauthenticated');
        }
      } else {
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, [router, t, toast]);

  const renderContent = () => {
    if (status === 'loading') {
      return <AuthLoadingScreen message={t('login.checkingAuth')} />;
    }
    if (status === 'unauthenticated') {
      return <LoginForm />;
    }
    // El estado 'authenticated' es transitorio antes de la redirección.
    return <AuthLoadingScreen message={t('login.redirecting')} />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-grow items-center justify-center p-4">
        {renderContent()}
      </main>
    </div>
  );
}
