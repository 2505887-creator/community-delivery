import { UserCircle } from 'lucide-react';

import TenantPortalPlaceholder from './TenantPortalPlaceholder';

export default function TenantProfile() {
  return (
    <TenantPortalPlaceholder
      icon={UserCircle}
      title="My Profile"
      description="Profile editing functionality is not currently connected to this dashboard. Your existing tenant information continues to be displayed where available."
    />
  );
}