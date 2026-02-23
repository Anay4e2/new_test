import { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const SkipToContent: FC = () => {
  const { t } = useTranslation();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg"
    >
      {t('accessibility.skipToContent')}
    </a>
  );
};
