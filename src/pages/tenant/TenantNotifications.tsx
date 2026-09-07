import { Bell } from 'lucide-react';

import TenantPortalPlaceholder from './TenantPortalPlaceholder';

export default function TenantNotifications() {
  return (
    <TenantPortalPlaceholder
      icon={Bell}
      title="Notifications"
      description="Notification functionality is not currently connected to a backend data source, so no notification records or counts are being invented."
    />
  );
}