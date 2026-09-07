import { Bookmark } from 'lucide-react';

import TenantPortalPlaceholder from './TenantPortalPlaceholder';

export default function TenantSavedProviders() {
  return (
    <TenantPortalPlaceholder
      icon={Bookmark}
      title="Saved Providers"
      description="Saved provider functionality is not currently connected to a backend handler or prop, so no saved-provider data is being fabricated here."
    />
  );
}