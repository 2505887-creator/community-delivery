-- OmniServe identity hardening.
-- Supabase Auth user IDs are UUIDs. The application previously mixed TEXT and UUID
-- identity columns. This migration normalizes those columns before Prisma uses them.

DO $$
DECLARE invalid_count integer;
BEGIN
  SELECT count(*) INTO invalid_count FROM "profiles" WHERE "id" IS NOT NULL AND "id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate profiles.id to UUID: % row(s) contain non-UUID IDs. Migrate legacy identities before applying this migration.', invalid_count; END IF;

  SELECT count(*) INTO invalid_count FROM "VerifiedPro" WHERE "userId" IS NOT NULL AND "userId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate VerifiedPro.userId to UUID: % invalid value(s) found.', invalid_count; END IF;

  SELECT count(*) INTO invalid_count FROM "Driver" WHERE "userId" IS NOT NULL AND "userId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate Driver.userId to UUID: % invalid value(s) found.', invalid_count; END IF;

  SELECT count(*) INTO invalid_count FROM "LocalStore" WHERE "ownerId" IS NOT NULL AND "ownerId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate LocalStore.ownerId to UUID: % invalid value(s) found.', invalid_count; END IF;

  SELECT count(*) INTO invalid_count FROM "Order" WHERE "tenantUserId" IS NOT NULL AND "tenantUserId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate Order.tenantUserId to UUID: % invalid value(s) found.', invalid_count; END IF;

  SELECT count(*) INTO invalid_count FROM "OrderAssignment" WHERE "assignedBy" IS NOT NULL AND "assignedBy" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  IF invalid_count > 0 THEN RAISE EXCEPTION 'Cannot migrate OrderAssignment.assignedBy to UUID: % invalid value(s) found.', invalid_count; END IF;
END $$;

ALTER TABLE "profiles" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "VerifiedPro" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "Driver" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "LocalStore" ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;
ALTER TABLE "Order" ALTER COLUMN "tenantUserId" TYPE UUID USING "tenantUserId"::uuid;
ALTER TABLE "OrderAssignment" ALTER COLUMN "assignedBy" TYPE UUID USING "assignedBy"::uuid;

