// src/components/ClientLandingPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { isAfter, parseISO, differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getTextColor } from '@/lib/color-utils';
import { ClientHeaderTop } from './ClientHeaderTop';
import { ClientHeaderBody1 } from './ClientHeaderBody1';
import { Button } from './ui/button';
import ClientBody from './ClientBody';
import type { Timestamp } from 'firebase/firestore';
import ClientPremiumLayout from './ClientPremiumLayout';
import { ClientData, HeaderData, MarqueeHeaderData, InfoCardData, GraphicData } from '@/types/client';

interface LandingPageProps {
  clientData: ClientData;
  ad?: any;
}

// --- COMPONENTE DE PESTAÑAS (TABS) ---
const Tab = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={cn(
        'whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'border-b-2 border-primary bg-white text-primary'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

const TabPanel = ({
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return <div className="tab-content">{children}</div>;
};

const Tabs = ({ children }: { children: React.ReactNode }) => {
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0] as React.ReactElement;
  const [activeTab, setActiveTab] = React.useState(firstChild?.props?.label);

  if (!childrenArray || childrenArray.length === 0) {
    return null;
  }

  const handleTabClick = (tabLabel: string) => {
    setActiveTab(tabLabel);
  };

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto border-b border-gray-200">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          return (
            <Tab
              key={child.props.label}
              label={child.props.label}
              isActive={child.props.label === activeTab}
              onClick={() => handleTabClick(child.props.label)}
            />
          );
        })}
      </div>
      <div className="rounded-b-lg bg-white p-6 shadow-sm">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          if (child.props.label === activeTab) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
};

// --- SUBCOMPONENTES ---

const MarqueeClientHeader = ({ data }: { data?: MarqueeHeaderData }) => {
  const { t } = useTranslation('common');
  const [daysLeft, setDaysLeft] = React.useState<number | null>(null);
  const [isOfferActive, setIsOfferActive] = React.useState(false);

  React.useEffect(() => {
    if (data?.offerEnabled && data.offerEndDate) {
      let endDate;
      if (typeof data.offerEndDate === 'string') {
        endDate = parseISO(data.offerEndDate);
      } else if (
        typeof data.offerEndDate === 'object' &&
        'seconds' in data.offerEndDate
      ) {
        endDate = new Date((data.offerEndDate as any).seconds * 1000);
      } else if (data.offerEndDate instanceof Date) {
        endDate = data.offerEndDate;
      }

      if (endDate) {
        const today = new Date();
        if (isAfter(endDate, today)) {
          const difference = differenceInDays(endDate, today);
          setDaysLeft(difference);
          setIsOfferActive(true);
        } else {
          setDaysLeft(null);
          setIsOfferActive(false);
        }
      }
    } else {
      setDaysLeft(null);
      setIsOfferActive(false);
    }
  }, [data?.offerEnabled, data?.offerEndDate]);

  if (!data || !data.enabled) return null;

  const renderButton = (
    text?: string,
    link?: string,
    className?: string,
    key?: string
  ) => {
    if (!text) return null;

    const buttonElement = (
      <Button className={cn('h-8 text-sm font-bold text-white', className)}>
        {text}
      </Button>
    );

    if (link) {
      return (
        <a href={link} key={key} target="_blank" rel="noopener noreferrer">
          {buttonElement}
        </a>
      );
    }
    return React.cloneElement(buttonElement, { key });
  };

  return (
    <div className="bg-[#333] text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-4 p-2">
          <div className="flex flex-shrink-0 items-center space-x-2">
            {isOfferActive &&
              renderButton(
                data.leftButtonText,
                data.leftButtonLink,
                'bg-red-600 hover:bg-red-700'
              )}
            {isOfferActive && daysLeft !== null && (
              <span className="text-sm font-bold text-yellow-400">
                {daysLeft} {daysLeft === 1 ? t('days.one') : t('days.other')}
              </span>
            )}
            {renderButton(
              data.clubButtonText,
              data.clubButtonLink,
              'bg-green-500 hover:bg-green-600'
            )}
          </div>

          {data.marqueeText && (
            <div className="marquesina-container flex-grow">
              <p className="texto-movil text-sm">{data.marqueeText}</p>
            </div>
          )}

          <div className="flex flex-shrink-0 items-center space-x-2">
            {renderButton(
              data.rightButton1Text,
              data.rightButton1Link,
              'bg-green-500 hover:bg-green-500',
              'rb1'
            )}
            {renderButton(
              data.rightButton2Text,
              data.rightButton2Link,
              'bg-green-500 hover:bg-green-500',
              'rb2'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DividerLine = ({
  color = '#FFFFFF',
  thickness = 1,
}: {
  color?: string;
  thickness?: number;
}) => (
  <div
    style={{
      backgroundColor: color,
      height: `${thickness}px`,
      width: '100%',
    }}
  />
);

const ClientHeader = ({ clientData }: { clientData: ClientData }) => {
  const { headerData, marqueeHeaderData } = clientData;

  const headerStyles: React.CSSProperties = {
    backgroundColor: headerData?.headerBackgroundColor || 'transparent',
    backgroundImage: headerData?.headerBackgroundImageUrl
      ? `url(${headerData.headerBackgroundImageUrl})`
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: headerData?.headerTextColor || 'inherit',
  };

  let textClassName = '';
  if (!headerData?.headerTextColor) {
    textClassName = headerData?.headerBackgroundColor
      ? getTextColor(headerData.headerBackgroundColor)
      : 'text-gray-800';
  }

  return (
    <header className="border-b bg-white">
      <MarqueeClientHeader data={marqueeHeaderData} />
      <div className="relative w-full" style={headerStyles}>
        {headerData?.headerBackgroundImageUrl && (
          <div className="absolute inset-0 z-0 bg-black opacity-30"></div>
        )}
        <div className="container mx-auto px-4">
          <ClientHeaderTop
            clientName={clientData.clientName}
            clientLogoUrl={clientData.clientLogoUrl}
            welcomeText={headerData?.welcomeText}
            headerImageUrl={headerData?.headerImageUrl}
            clientLogoWidth={headerData?.clientLogoWidth}
            textClassName={textClassName}
            clientId={clientData.id}
          />
        </div>
        {headerData?.dividerLine?.enabled && (
          <DividerLine
            color={headerData.dividerLine.color}
            thickness={headerData.dividerLine.thickness}
          />
        )}
      </div>
    </header>
  );
};

const InfoCardsSectionAsTabs = ({
  infoCards,
}: {
  infoCards?: InfoCardData[];
}) => {
  const validCards =
    infoCards?.filter((card) => card.title && card.content) || [];

  if (validCards.length === 0) return null;

  return (
    <Tabs>
      {validCards.map((card, index) => (
        <TabPanel key={index} label={card.title}>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: card.content }}
          />
        </TabPanel>
      ))}
    </Tabs>
  );
};

const GraphicsGrid = ({ graphics }: { graphics?: GraphicData[] }) => {
  const [randomGraphics, setRandomGraphics] = React.useState<GraphicData[]>([]);

  React.useEffect(() => {
    if (graphics && graphics.length > 0) {
      const validGraphics = graphics.filter((g) => g.imageUrl && g.targetUrl);
      const shuffled = [...validGraphics].sort(() => 0.5 - Math.random());
      setRandomGraphics(shuffled.slice(0, Math.min(shuffled.length, 4)));
    }
  }, [graphics]);

  if (randomGraphics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {randomGraphics.map((graphic, index) => (
        <a
          key={index}
          href={graphic.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-lg shadow-md"
        >
          <div className="aspect-w-1 aspect-h-1 relative">
            <Image
              src={graphic.imageUrl}
              alt={graphic.text || `Graphic ${index + 1}`}
              fill
              style={{ objectFit: 'cover' }}
              className="transform transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-10 transition-all group-hover:bg-opacity-30"></div>
          </div>
          {graphic.text && (
            <div className="bg-white p-2">
              <p className="text-center text-xs text-gray-700">
                {graphic.text}
              </p>
            </div>
          )}
        </a>
      ))}
    </div>
  );
};

export default function ClientLandingPage({ clientData, ad }: LandingPageProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const translations = clientData.translations || {};
    const availableLanguages = Object.keys(translations);

    for (const lang of availableLanguages) {
      if (translations[lang]) {
        i18n.addResourceBundle(lang, 'client', translations[lang]);
      }
    }

    // Clean up resources when component unmounts
    return () => {
      for (const lang of availableLanguages) {
        i18n.removeResourceBundle(lang, 'client');
      }
    };
  }, [clientData.translations, i18n]);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: clientData.bodyData?.body2BackgroundColor || '#F9FAFB',
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use Premium Layout if client type is premium OR if layout data exists
  if (clientData.clientType === 'premium' || (clientData.layout && clientData.layout.length > 0)) {
    return <ClientPremiumLayout clientData={clientData} ad={ad} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <ClientHeader clientData={clientData} />
      <div className="container mx-auto px-4">
        <ClientHeaderBody1 headerData={clientData.headerData} clientId={clientData.id} />
        <ClientBody data={clientData.bodyData} />

        <section className="-mx-4 px-4 py-12" style={sectionStyle}>
          <div className="container mx-auto grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="lg:col-span-1">
              <InfoCardsSectionAsTabs infoCards={clientData.infoCards} />
            </div>
            <div className="lg:col-span-1">
              {isMounted && <GraphicsGrid graphics={clientData.graphics} />}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
