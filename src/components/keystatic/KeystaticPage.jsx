import { Keystatic } from '@keystatic/core/ui';
import config from '../../../keystatic.config.js';

const appSlug = {
  envName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
  value: import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG,
};

export default function KeystaticPage() {
  return <Keystatic config={config} appSlug={appSlug} />;
}
