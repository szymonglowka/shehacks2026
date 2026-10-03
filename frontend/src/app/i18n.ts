import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLngs = ['pl', 'en'] as const;
export type SupportedLng = (typeof supportedLngs)[number];
export const fallbackLng: SupportedLng = 'pl';

// AUTO-REGISTRATION: every src/features/*/locales/{pl,en}.json becomes
// the i18next namespace named after the feature folder.
const localeModules = import.meta.glob<{ default: Record<string, string> }>(
  '../features/*/locales/*.json',
  { eager: true },
);

const resources: Record<string, Record<string, Record<string, string>>> = {};
for (const [path, mod] of Object.entries(localeModules)) {
  const match = path.match(/features\/([^/]+)\/locales\/([^/.]+)\.json$/);
  if (!match) continue;
  const [, ns, lng] = match;
  resources[lng] ??= {};
  resources[lng][ns] = { ...(resources[lng][ns] ?? {}), ...mod.default };
}

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('otula:lng') ?? fallbackLng,
  fallbackLng,
  supportedLngs: [...supportedLngs],
  defaultNS: false,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('otula:lng', lng);
  document.documentElement.lang = lng;
});

export default i18n;
