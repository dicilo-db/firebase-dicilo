with open("src/app/dashboard/business/graphics-vip/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the dynamic import loading state
old_loading = """const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor'),
  { ssr: false, loading: () => <div className="p-12 text-center text-amber-600 font-bold animate-pulse">{t('business.graphicsVip.engine', 'Cargando el Motor Biográfico de I.A...')}</div> }
);"""

new_loading = """
const LoaderComponent = () => {
  const { t } = useTranslation('common');
  return <div className="p-12 text-center text-amber-600 font-bold animate-pulse">{t('business.graphicsVip.engine', 'Cargando el Motor Biográfico de I.A...')}</div>;
};

const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor'),
  { ssr: false, loading: () => <LoaderComponent /> }
);
"""

content = content.replace(old_loading, new_loading)

with open("src/app/dashboard/business/graphics-vip/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

