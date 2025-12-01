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
import { useRouter } from 'next/navigation';

const auth = getAuth(app);

const AuthLoadingScreen = ({ message }: { message: string }) => (
    <div className="flex flex-grow flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
    </div>
);

const LoginForm = () => {
    const { t } = useTranslation('login');
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
            // onAuthStateChanged will handle redirection
        } catch (error: any) {
            let errorMessageKey = 'error.invalidCredentials';
            if (
                error.code &&
                (error.code.includes('auth/user-not-found') ||
                    error.code.includes('auth/wrong-password') ||
                    error.code.includes('auth/invalid-credential'))
            ) {
                errorMessageKey = 'error.invalidCredentials';
            } else {
                errorMessageKey = 'error.generic';
            }
            toast({
                title: t('error.title'),
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
                title: t('reset.errorTitle'),
                description: t('reset.emailRequired'),
                variant: 'destructive',
            });
            return;
        }
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: t('reset.successTitle'),
                description: t('reset.successDescription', { email }),
            });
        } catch (error: any) {
            let errorMessageKey = 'reset.errorGeneric';
            if (error.code === 'auth/user-not-found') {
                errorMessageKey = 'reset.userNotFound';
            }
            toast({
                title: t('reset.errorTitle'),
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
                <CardTitle className="text-2xl">{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('emailLabel')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">{t('passwordLabel')}</Label>
                            <Button
                                variant="link"
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isSubmitting}
                                className="h-auto p-0 text-xs"
                            >
                                {t('forgotPassword')}
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
                                aria-label={t('showPassword')}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            t('loginButton')
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default function LoginPage() {
    const router = useRouter();
    const { t } = useTranslation('login');
    const [status, setStatus] = useState<
        'loading' | 'unauthenticated' | 'authenticated'
    >('loading');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                setStatus('authenticated');
                router.push('/dashboard');
            } else {
                setStatus('unauthenticated');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const renderContent = () => {
        if (status === 'loading') {
            return <AuthLoadingScreen message={t('checkingAuth') || 'Loading...'} />;
        }
        if (status === 'unauthenticated') {
            return <LoginForm />;
        }
        return <AuthLoadingScreen message={t('successDescription')} />;
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
