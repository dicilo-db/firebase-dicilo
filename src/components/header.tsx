// src/components/header.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { LanguageSelector } from './LanguageSelector';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/vorteile', labelKey: 'header.nav.benefits' },
  { href: '/planes', labelKey: 'header.nav.planes' },
  { href: '/ueber-uns', labelKey: 'header.nav.about' },
  { href: '/verzeichnis', labelKey: 'header.nav.directory' },
];

const Header = () => {
  const { t } = useTranslation('common');
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="relative z-10 flex-shrink-0 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Dicilo"
              width={120}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <nav className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Button
                  variant="link"
                  asChild
                  className="h-auto p-0 text-base font-medium text-foreground"
                  key={link.href}
                >
                  <Link href={link.href}>{t(link.labelKey)}</Link>
                </Button>
              ))}
            </nav>

            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-muted" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/dashboard">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  {t('header.nav.logout', 'Abmelden')}
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">{t('header.nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/registrieren">{t('header.nav.register')}</Link>
                </Button>
              </>
            )}
            <LanguageSelector />
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-left text-2xl font-bold text-primary">
                    Dicilo
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 pt-6">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start py-3 text-left text-lg"
                      >
                        <Link href={link.href}>{t(link.labelKey)}</Link>
                      </Button>
                    </SheetClose>
                  ))}

                  {!loading && user ? (
                    <>
                      <SheetClose asChild>
                        <Button
                          asChild
                          variant="ghost"
                          className="w-full justify-start py-3 text-left text-lg"
                        >
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start py-3 text-left text-lg text-destructive"
                          onClick={handleLogout}
                        >
                          {t('header.nav.logout', 'Abmelden')}
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button
                          asChild
                          variant="ghost"
                          className="w-full justify-start py-3 text-left text-lg"
                        >
                          <Link href="/login">{t('header.nav.login')}</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          asChild
                          variant="default"
                          className="w-full justify-start py-3 text-left text-lg"
                        >
                          <Link href="/registrieren">
                            {t('header.nav.register')}
                          </Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                      {t('header.nav.language')}
                    </h3>
                    <LanguageSelector />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
