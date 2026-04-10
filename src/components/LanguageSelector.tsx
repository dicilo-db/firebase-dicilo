// src/components/LanguageSelector.tsx
'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DeFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="15"
    viewBox="0 0 5 3"
  >
    <path d="M0 0h5v3H0z" />
    <path fill="#D00" d="M0 1h5v2H0z" />
    <path fill="#FFCE00" d="M0 2h5v1H0z" />
  </svg>
);
const EnFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="15"
    viewBox="0 0 60 30"
  >
    <path fill="#012169" d="M0 0h60v30H0z" />
    <path fill="#FFF" d="m60 0-60 30m0-30 60 30" />
    <path
      fill="#C8102E"
      d="m-9 12 23 18H-1l3-18H-9zm51 6L38 0h22v15l-3 3h-4zM0 12v6h60v-6zM27 0v30h6V0z"
    />
    <path fill="#FFF" d="M0 0v3l27 21h6L.5 0H0zm60 30v-3L33 6h-6l32.5 24H60z" />
  </svg>
);
const EsFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="15"
    viewBox="0 0 3 2"
  >
    <path fill="#c60b1e" d="M0 0h3v2H0z" />
    <path fill="#ffc400" d="M0 .5h3v1H0z" />
  </svg>
);

export const languageOptions = [
  { code: 'de', name: 'Deutsch', flag: <DeFlag /> },
  { code: 'en', name: 'English', flag: <EnFlag /> },
  { code: 'es', name: 'Español', flag: <EsFlag /> },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLocaleChange = (newLocale: string) => {
    i18n.changeLanguage(newLocale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languageOptions.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            disabled={i18n.language === lang.code}
          >
            <div className="flex items-center gap-2">
              {lang.flag}
              <span>{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
