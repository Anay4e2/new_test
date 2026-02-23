import { FC } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
];

export const LanguageSelector: FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
      className={`bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ''}`}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code} className="bg-slate-800 text-white">
          {lang.label}
        </option>
      ))}
    </select>
  );
};
