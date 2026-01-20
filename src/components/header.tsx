// src/components/header.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, User as UserIcon, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSelector } from './LanguageSelector';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

// Desktop visible links
const desktopLinks = [
  { href: '/vorteile', labelKey: 'header.nav.benefits' },
  { href: '/planes', labelKey: 'header.nav.planes' },
  { href: '/ueber-uns', labelKey: 'header.nav.about' },
];

// Mobile menu links (Hamburguesa)
const mobileLinks = [
  { href: '/dicicoin', labelKey: 'header.nav.dicicoin' },
  { href: '/registrieren', labelKey: 'header.nav.register' }, // Registrieren
  { href: '/verzeichnis', labelKey: 'header.nav.directory' }, // Kategorie/Verzeichnis
  { href: '/impressum', labelKey: 'header.nav.imprint' },
  { href: '/datenschutz', labelKey: 'header.nav.privacy' },
  { href: '/faq', labelKey: 'header.nav.faq' },
];

const Header = () => {
  const { t } = useTranslation('common');
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [neighborhoodSlug, setNeighborhoodSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchNeighborhood = async () => {
      if (!user) {
        setNeighborhoodSlug(null);
        return;
      }

      const db = getFirestore(app);
      try {
        // First try private profile
        const privateRef = doc(db, 'private_profiles', user.uid);
        const privateSnap = await getDoc(privateRef);
        if (privateSnap.exists() && privateSnap.data().neighborhood) {
          setNeighborhoodSlug(privateSnap.data().neighborhood);
          return;
        }

        // Then try client profile (if business owner)
        // Note: This is simplified. Ideally we check 'clients' collection by ownerUid.
        // But for Header speed, we might rely on a 'claim' or just skip if expensive.
        // Let's assume most active users in "Barrio" are private users for now, 
        // or we add a lighter lookup. 
        // For now, let's Stick to Private Profile as the main entry for "My Neighborhood".
      } catch (e) {
        console.error("Error fetching neighborhood", e);
      }
    };
    fetchNeighborhood();
  }, [user]);
  // We can add hydration check if needed, but simple CSS classes handle responsive display best without flash.

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="relative z-10 flex-shrink-0 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center flex-shrink-0 mr-4">
            {/* Logo Logic:
                 Mobile (< 768px): Show Isotype (/logo.png).
                 Desktop (>= 768px): Show Full Logo (/Logo negro dicilo.png).
                 Exception: The user mentioned a Home Page exception, but emphasized prioritizing Rule 1 (Screen Size).
                 Rule 1 states Desktop MUST show Full Logo. We adhere to Rule 1.
             */}

            {/* Mobile Logo (Full Text) - Visible up to md (Request 2: Mobile must show Full Logo) */}
            <div className="block md:hidden">
              <Image
                src="/Logo negro dicilo.png"
                alt="Dicilo Logo"
                width={140}
                height={46}
                className="h-10 w-auto"
                priority
              />
            </div>

            {/* Desktop Logo - Visible from md upwards */}
            <div className="hidden md:block">
              {/* Request 1: Home Page shows Icon Only, Inner Pages show Full Logo */}
              {pathname === '/' ? (
                <Image
                  src="/logo.png"
                  alt="Dicilo Isotype"
                  width={50}
                  height={50}
                  className="h-12 w-auto"
                  priority
                />
              ) : (
                <Image
                  src="/Logo negro dicilo.png"
                  alt="Dicilo Logo"
                  width={150}
                  height={50}
                  className="h-12 w-auto"
                  priority
                />
              )}
            </div>
          </Link>

          {/* DESKTOP MENU - Visible from md breakpoint */}
          <div className="hidden items-center gap-4 md:flex">
            <nav className="flex items-center gap-4">
              {desktopLinks.map((link) => (
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

            {/* MORE MENU (Desktop) - Secondary Links */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More links">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {mobileLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="cursor-pointer">
                      {t(link.labelKey)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-muted" />
            ) : user ? (
              <>
                {/* Full User Menu (Visible on Large Screens) */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button asChild variant="ghost">
                    <Link href="/dashboard">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  {neighborhoodSlug && (
                    <Button asChild variant="ghost">
                      <Link href={`/barrio/${neighborhoodSlug}`}>
                        <MapPin className="mr-2 h-4 w-4" />
                        {t('header.nav.myNeighborhood', 'Mi Barrio')}
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleLogout}>
                    {t('header.nav.logout', 'Abmelden')}
                  </Button>
                  <LanguageSelector />
                </div>

                {/* Compact User Menu (Visible on Medium Screens, Hidden on Large) */}
                <div className="flex lg:hidden items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <UserIcon className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer font-semibold">
                          Dashboard Home
                        </Link>
                      </DropdownMenuItem>

                      <div className="p-2 border-t mt-1">
                        <p className="text-xs text-muted-foreground mb-2 px-2">{t('header.nav.language', 'Sprache')}</p>
                        <div className="flex justify-center">
                          <LanguageSelector />
                        </div>
                      </div>

                      <div className="border-t mt-1 pt-1">
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                          {t('header.nav.logout', 'Abmelden')}
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              // Desktop: Solo "Iniciar Sesión" (Login) visible directo según plan
              <Button variant="ghost" asChild>
                <Link href="/login">{t('header.nav.login')}</Link>
              </Button>
            )}

            {/* Show Language Selector separately only on LG screens (handled inside the block above for users, preventing duplicate) */}
            {/* But for non-users? Let's add it back for non-users or general usage on LG */}
            {!user && (
              <div className="ml-2">
                <LanguageSelector />
              </div>
            )}
          </div>

          {/* MOBILE MENU (HAMBURGER) - Hidden on md breakpoint */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left text-2xl font-bold text-primary">
                    Dicilo
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 pt-6">

                  {/* Top Action Button: Login if guest, Dashboard if user */}
                  {!loading && !user && (
                    <SheetClose asChild>
                      <Button asChild variant="default" className="w-full justify-center py-6 text-lg font-bold shadow-md">
                        <Link href="/login">
                          {t('header.nav.login')}
                        </Link>
                      </Button>
                    </SheetClose>
                  )}

                  {/* Dashboard / Logout mobile items */}
                  {!loading && user && (
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Button asChild variant="default" className="w-full justify-center py-6 text-lg font-bold shadow-md">
                          <Link href="/dashboard"><UserIcon className="mr-2 h-4 w-4" /> Dashboard</Link>
                        </Button>
                      </SheetClose>
                      {neighborhoodSlug && (
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full justify-center py-6 text-lg font-bold shadow-sm">
                            <Link href={`/barrio/${neighborhoodSlug}`}>
                              <MapPin className="mr-2 h-4 w-4" />
                              {t('header.nav.myNeighborhood', 'Mi Barrio')}
                            </Link>
                          </Button>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                          {t('header.nav.logout', 'Abmelden')}
                        </Button>
                      </SheetClose>
                    </div>
                  )}

                  <hr className="my-2" />

                  {/* All Menu Links (Main + Legal) */}
                  <div className="space-y-1">
                    {[...desktopLinks, ...mobileLinks].map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Button
                          asChild
                          variant="ghost"
                          className="w-full justify-start py-3 text-left text-lg pl-2 border-l-4 border-transparent hover:border-primary"
                        >
                          <Link href={link.href}>{t(link.labelKey)}</Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>

                  <hr className="my-2" />

                  {/* Secondary Action: Register if guest */}
                  {!loading && !user && (
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full justify-center mt-2">
                        <Link href="/registrieren">
                          ✨ {t('header.nav.register')}
                        </Link>
                      </Button>
                    </SheetClose>
                  )}

                  <div className="pt-4 pb-8">
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

