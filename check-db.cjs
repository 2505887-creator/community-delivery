const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      to_regclass('public."UserPreferences"')::text AS user_preferences,
      to_regclass('public."Notification"')::text AS notification,
      to_regclass('public."NotificationPreference"')::text AS notification_preferences,
      to_regclass('public."AuditEvent"')::text AS audit_event,
      to_regclass('public."EmailJob"')::text AS email_job,
      to_regclass('public."EmailTemplate"')::text AS email_template,
      to_regclass('public."EmailTemplateVersion"')::text AS email_template_version,
      to_regclass('public."SystemSetting"')::text AS system_setting
  `);

  console.dir(rows, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
