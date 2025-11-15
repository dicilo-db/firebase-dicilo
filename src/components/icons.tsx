import React from 'react';

// Using FontAwesome icons for consistency and maintainability as the library is already included.
// This avoids large SVG strings in the codebase.

const FaIcon: React.FC<{
  icon: string;
  className?: string;
  'aria-label'?: string;
}> = ({ icon, className, 'aria-label': ariaLabel }) => (
  <i className={`${icon} ${className}`} aria-label={ariaLabel}></i>
);

// General Icons
export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-bars" className={className} />
);
export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-xmark" className={className} />
);
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-magnifying-glass" className={className} />
);
export const CheckCircleIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-check-circle" className={className} />;
export const RocketLaunchIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-rocket" className={className} />;
export const UserGroupIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-user-group" className={className} />;
export const SparklesIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-sparkles" className={className} />;
export const BuildingOfficeIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-building-columns" className={className} />;
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-clock" className={className} />
);
export const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-spinner fa-spin" className={className} />;
export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-user" className={className} />
);
export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-solid fa-users" className={className} />
);
export const BriefcaseIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-briefcase" className={className} />;
export const ChevronDownIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-solid fa-chevron-down" className={className} />;

// Category Icons
const ConsultingIcon = <FaIcon icon="fa-solid fa-users" />;
const EducationIcon = <FaIcon icon="fa-solid fa-graduation-cap" />;
const FinanceIcon = <FaIcon icon="fa-solid fa-chart-line" />;
const GastronomyIcon = <FaIcon icon="fa-solid fa-utensils" />;
const HealthIcon = <FaIcon icon="fa-solid fa-heart-pulse" />;
const HospitalityIcon = <FaIcon icon="fa-solid fa-hotel" />;
const RealEstateIcon = <FaIcon icon="fa-solid fa-building" />;
const FoodIcon = <FaIcon icon="fa-solid fa-carrot" />;
const MusicIcon = <FaIcon icon="fa-solid fa-music" />;
const SocialIcon = <FaIcon icon="fa-solid fa-hand-holding-heart" />;
const SportsIcon = <FaIcon icon="fa-solid fa-person-running" />;
const TravelIcon = <FaIcon icon="fa-solid fa-plane" />;
const TechnologyIcon = <FaIcon icon="fa-solid fa-microchip" />;
const TextilesIcon = <FaIcon icon="fa-solid fa-shirt" />;
const PetsIcon = <FaIcon icon="fa-solid fa-paw" />;
const TransportIcon = <FaIcon icon="fa-solid fa-truck-fast" />;
const EnvironmentIcon = <FaIcon icon="fa-solid fa-leaf" />;
const EntertainmentIcon = <FaIcon icon="fa-solid fa-film" />;

export const CategoryIcons: { [key: string]: React.ReactElement } = {
  consulting: ConsultingIcon,
  education: EducationIcon,
  finance: FinanceIcon,
  gastronomy: GastronomyIcon,
  health: HealthIcon,
  hospitality: HospitalityIcon,
  realEstate: RealEstateIcon,
  food: FoodIcon,
  music: MusicIcon,
  social: SocialIcon,
  sports: SportsIcon,
  travel: TravelIcon,
  technology: TechnologyIcon,
  textiles: TextilesIcon,
  pets: PetsIcon,
  transport: TransportIcon,
  environment: EnvironmentIcon,
  entertainment: EntertainmentIcon,
};

// Social Media Icons
export const WhatsAppIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-whatsapp" className={className} />;
export const TelegramIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-telegram" className={className} />;
export const InstagramIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-instagram" className={className} />;
export const FacebookIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-facebook" className={className} />;
export const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-brands fa-tiktok" className={className} />
);
export const LinkedInIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-linkedin" className={className} />;
export const YouTubeIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-youtube" className={className} />;
export const XTwitterIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-x-twitter" className={className} />;
export const TwitchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FaIcon icon="fa-brands fa-twitch" className={className} />
);
export const PinterestIcon: React.FC<{ className?: string }> = ({
  className,
}) => <FaIcon icon="fa-brands fa-pinterest" className={className} />;

// DiciBot Icon
export const DiciBotIcon: React.FC<{
  className?: string;
  'aria-label'?: string;
}> = ({ className, 'aria-label': ariaLabel }) => (
  <FaIcon
    icon="fa-solid fa-robot"
    className={className}
    aria-label={ariaLabel}
  />
);
