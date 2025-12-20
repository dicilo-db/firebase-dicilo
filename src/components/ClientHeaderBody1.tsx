// src/components/ClientHeaderBody1.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Facebook, Twitter, Linkedin, Mail, Copy } from 'lucide-react';
import { WhatsAppIcon } from './icons';
import { useToast } from '@/hooks/use-toast';

interface HeaderData {
  socialLinks?: { icon: string; url: string }[];
  bannerType?: 'embed' | 'url' | 'upload';
  bannerEmbedCode?: string;
  bannerImageUrl?: string;
  bannerImageWidth?: number;
  bannerImageHeight?: number;
  socialShareText?: string;
  bannerShareUrl?: string;
}

const ShareDialog = ({ headerData }: { headerData?: HeaderData }) => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();

  const handleShare = (platform: string) => {
    const shareUrl = headerData?.bannerShareUrl || window.location.href;
    const text = headerData?.socialShareText || t('common:share.defaultText');
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(t('common:share.emailSubject'))}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const copyToClipboard = () => {
    const shareUrl = headerData?.bannerShareUrl || window.location.href;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast({ title: t('share.copied') });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button variant="secondary">{t('share.button')}</Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <Button variant="outline" onClick={() => handleShare('facebook')}>
            <Facebook className="mr-2" /> Facebook
          </Button>
          <Button variant="outline" onClick={() => handleShare('whatsapp')}>
            <WhatsAppIcon className="mr-2" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={() => handleShare('twitter')}>
            <Twitter className="mr-2" /> X
          </Button>
          <Button variant="outline" onClick={() => handleShare('linkedin')}>
            <Linkedin className="mr-2" /> LinkedIn
          </Button>
          <Button variant="outline" onClick={() => handleShare('email')}>
            <Mail className="mr-2" /> Email
          </Button>
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="mr-2" /> {t('share.copy')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ClientHeaderBody1 = ({
  headerData,
  clientId,
}: {
  headerData?: HeaderData;
  clientId?: string;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const socialLinks =
    headerData?.socialLinks?.filter((link) => link.icon && link.url) || [];

  const handleSocialClick = async (url: string, iconName: string) => {
    // Log analytics if clientId is present
    if (clientId) {
      try {
        await fetch('/api/analytics/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'socialClick',
            businessId: clientId,
            details: iconName, // e.g. 'facebook', 'instagram'
            timestamp: new Date().toISOString()
          }),
        });
      } catch (e) {
        console.error("Failed to log social click", e);
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasEmbedCode =
    headerData?.bannerType === 'embed' && headerData?.bannerEmbedCode;
  const hasImageBanner =
    (headerData?.bannerType === 'url' || headerData?.bannerType === 'upload') &&
    headerData?.bannerImageUrl;

  const bannerWidth = headerData?.bannerImageWidth
    ? `${headerData.bannerImageWidth}%`
    : '100%';
  const bannerHeight = headerData?.bannerImageHeight
    ? `${headerData.bannerImageHeight}px`
    : 'auto';

  return (
    <div className="py-8">
      <div className="flex flex-col items-start justify-center gap-8 md:flex-row">
        {/* Columna de los 6 botones */}
        {socialLinks.length > 0 && (
          <div className="w-full md:w-auto md:max-w-xs">
            <div
              className="grid grid-cols-3 gap-3 md:grid-cols-2"
              style={{ height: '150px' }}
            >
              {socialLinks.slice(0, 6).map((link, index) => (
                <Button
                  key={index}
                  onClick={() => handleSocialClick(link.url, link.icon)}
                  className="h-full w-full bg-green-600 text-lg font-bold text-white hover:bg-green-700"
                >
                  {link.icon}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Columna del Banner Embed o Imagen */}
        <div className="flex w-full flex-1 justify-center md:justify-start">
          {hasImageBanner && (
            <div style={{ width: bannerWidth }} className="group relative">
              <Image
                src={headerData.bannerImageUrl!}
                alt="Banner"
                width={headerData.bannerImageWidth ? 1200 : 600}
                height={headerData.bannerImageHeight || 400}
                className="rounded-lg object-cover shadow-lg"
                style={{
                  width: '100%',
                  height: bannerHeight,
                }}
              />
              {isMounted && <ShareDialog headerData={headerData} />}
            </div>
          )}
          {hasEmbedCode && (
            <div className="w-full" style={{ width: bannerWidth }}>
              <div
                className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md"
                dangerouslySetInnerHTML={{
                  __html: headerData.bannerEmbedCode as string,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
