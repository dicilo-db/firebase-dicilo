'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavLink {
  href: string;
  labelKey: string;
  defaultText?: string;
}

interface SmartNavProps {
  desktopLinks: NavLink[];
  mobileLinks: NavLink[];
}

export function SmartNav({ desktopLinks, mobileLinks }: SmartNavProps) {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(desktopLinks.length);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);
  const [moreButtonWidth, setMoreButtonWidth] = useState(0);

  // Measure all items once when mounted or translation changes
  useEffect(() => {
    if (!containerRef.current) return;

    const measureContainer = document.createElement('div');
    measureContainer.style.position = 'absolute';
    measureContainer.style.visibility = 'hidden';
    measureContainer.style.whiteSpace = 'nowrap';
    measureContainer.style.display = 'flex';
    measureContainer.style.gap = '1rem'; // 16px gap
    measureContainer.className = 'text-base font-medium'; // Match styling
    document.body.appendChild(measureContainer);

    const widths: number[] = [];
    desktopLinks.forEach((link) => {
      const el = document.createElement('div');
      el.style.padding = '0'; // Matches h-auto p-0
      el.textContent = t(link.labelKey, link.defaultText || '');
      measureContainer.appendChild(el);
      widths.push(el.getBoundingClientRect().width);
    });

    const moreBtn = document.createElement('div');
    moreBtn.style.padding = '0.5rem'; // Button size icon padding
    moreBtn.innerHTML = '<svg width="16" height="16"></svg>';
    measureContainer.appendChild(moreBtn);
    setMoreButtonWidth(moreBtn.getBoundingClientRect().width);

    setMeasuredWidths(widths);
    document.body.removeChild(measureContainer);
  }, [t, desktopLinks]);

  useEffect(() => {
    if (measuredWidths.length === 0) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableWidth = entry.contentRect.width;
        let currentWidth = moreButtonWidth; // Always account for the more button just in case
        let newVisibleCount = 0;

        for (let i = 0; i < measuredWidths.length; i++) {
          // Add item width + 16px gap
          const itemWidth = measuredWidths[i] + (i > 0 ? 16 : 0);
          if (currentWidth + itemWidth <= availableWidth) {
            currentWidth += itemWidth;
            newVisibleCount++;
          } else {
            break;
          }
        }

        // If all fit, we don't strictly need the more button, but we might still have mobile links
        // We'll just set the visible count
        setVisibleCount(newVisibleCount);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [measuredWidths, moreButtonWidth]);

  const visibleLinks = desktopLinks.slice(0, visibleCount);
  const hiddenLinks = desktopLinks.slice(visibleCount);

  // Combine hidden desktop links with mobile links, avoiding duplicates
  const allHiddenLinks = [...hiddenLinks];
  mobileLinks.forEach(ml => {
    if (!allHiddenLinks.find(hl => hl.href === ml.href) && !visibleLinks.find(vl => vl.href === ml.href)) {
      allHiddenLinks.push(ml);
    }
  });

  return (
    <div className="flex w-full items-center justify-end overflow-hidden" ref={containerRef}>
      <nav className="flex items-center gap-4">
        {visibleLinks.map((link) => (
          <Button
            variant="link"
            asChild
            className="h-auto p-0 text-base font-medium text-foreground whitespace-nowrap"
            key={link.href}
          >
            <Link href={link.href}>{t(link.labelKey, link.defaultText || '')}</Link>
          </Button>
        ))}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More links" className="ml-4 shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allHiddenLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href} className="cursor-pointer">
                {t(link.labelKey, link.defaultText || '')}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
