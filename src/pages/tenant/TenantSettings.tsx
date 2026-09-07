import { Settings } from 'lucide-react';

import TenantPortalPlaceholder from './TenantPortalPlaceholder';

export default function TenantSettings() {
  return (
    <TenantPortalPlaceholder
      icon={Settings}
      title="Settings"
      description="Tenant settings functionality is not currently connected to this dashboard."
    />
  );
}
