import express, {
  Response,
} from 'express';

import {
  PrismaClient,
  OrderStatus,
  OrderType,
} from '@prisma/client';

import {
  requireAuth,
  AuthedRequest,
} from './lib/supabaseAdmin';

const prisma =
  new PrismaClient();

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Order status workflow
|--------------------------------------------------------------------------
|
| pending
|    ↓
| assigned
|    ↓
| en_route
|    ↓
| arrived
|    ↓
| in_progress
|    ↓
| completed
|
| cancelled can happen before completion.
|
*/

const statusSequence: OrderStatus[] = [
  'pending',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
];

const allowedStatuses =
  new Set<OrderStatus>([
    ...statusSequence,
    'cancelled',
  ]);

const statusIndex = (
  status: OrderStatus
) =>
  statusSequence.indexOf(status);

/*
|--------------------------------------------------------------------------
| Prisma include
|--------------------------------------------------------------------------
*/

const orderInclude = {
  provider: true,
  driver: true,
  store: true,

  messages: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

/*
|--------------------------------------------------------------------------
| Serialization
|--------------------------------------------------------------------------
|
| Keep the API shape stable for the React application.
|
*/

function serializeOrder(
  order: any
) {
  return {
    id: order.id,

    type: order.type,

    title: order.title,

    category:
      order.category ??
      undefined,

    status:
      order.status,

    createdAt:
      order.createdAt
        ?.toISOString?.() ??
      order.createdAt,

    /*
     * CUSTOMER
     */
    tenantName:
      order.tenantName,

    tenantPhone:
      order.tenantPhone,

    tenantAddress:
      order.tenantAddress,

    apartmentUnit:
      order.apartmentUnit ??
      undefined,

    /*
     * PROVIDER
     */
    providerId:
      order.providerId ??
      undefined,

    providerName:
      order.provider?.name,

    providerAvatar:
      order.provider?.avatar,

    providerPhone:
      order.provider?.phone,

    /*
     * DRIVER
     */
    driverId:
      order.driverId ??
      undefined,

    driverName:
      order.driver?.name,

    driverAvatar:
      order.driver?.avatar,

    driverVehicle:
      order.driver?.vehicleType,

    driverPhone:
      order.driver?.phone,

    /*
     * STORE
     */
    storeId:
      order.storeId ??
      undefined,

    storeName:
      order.store?.name,

    storeType:
      order.store?.type,

    /*
     * FINANCIALS
     */
    subtotal:
      Number(order.subtotal),

    deliveryFee:
      Number(order.deliveryFee),

    serviceFee:
      Number(order.serviceFee),

    tax:
      Number(order.tax),

    total:
      Number(order.total),

    paymentMethod:
      order.paymentMethod,

    /*
     * TIMING
     */
    estimatedArrivalMin:
      Number(
        order.estimatedArrivalMin
      ),

    urgency:
      order.urgency,

    scheduledFor:
      order.scheduledFor
        ?.toISOString?.() ??
      undefined,

    notes:
      order.notes ??
      undefined,

    /*
     * LOCATIONS
     */
    tenantLocation: {
      lat:
        order.tenantLat ??
        0,

      lng:
        order.tenantLng ??
        0,

      label:
        order.tenantAddress,
    },

    originLocation: {
      lat:
        order.originLat ??
        0,

      lng:
        order.originLng ??
        0,

      label:
        order.provider?.address ??
        order.store?.address ??
        'Nairobi, Kenya',
    },

    currentLocation: {
      lat:
        order.currentLat ??
        order.originLat ??
        0,

      lng:
        order.currentLng ??
        order.originLng ??
        0,
    },

    /*
     * MESSAGES
     */
    messages:
      (
        order.messages ??
        []
      ).map(
        (message: any) => ({
          id:
            message.id,

          sender:
            message.sender,

          senderName:
            message.senderName,

          text:
            message.text,

          timestamp:
            message.createdAt
              ?.toISOString?.() ??
            message.createdAt,
        })
      ),
  };
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function isValidOrderType(
  value: unknown
): value is OrderType {
  return (
    value ===
      'service' ||
    value ===
      'store_delivery' ||
    value ===
      'ride_cargo'
  );
}

function isFiniteNumber(
  value: unknown
): boolean {
  return Number.isFinite(
    Number(value)
  );
}

/*
|--------------------------------------------------------------------------
| GET /api/orders
|--------------------------------------------------------------------------
|
| Visibility rules:
|
| CUSTOMER:
|   Only orders where tenantUserId === auth user ID.
|
| PROVIDER:
|   - Orders assigned to their VerifiedPro
|   - Pending service requests matching their category
|
| DRIVER:
|   Only orders assigned to their Driver record.
|
| ADMIN:
|   All orders.
|
*/

router.get(
  '/',
  requireAuth(),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      let where: any = {};

      /*
       * CUSTOMER
       */
      if (
        actor.role ===
        'tenant'
      ) {
        where = {
          tenantUserId:
            actor.id,
        };
      }

      /*
       * PROVIDER
       */
      else if (
        actor.role ===
        'provider'
      ) {
        const provider =
          await prisma.verifiedPro.findUnique(
            {
              where: {
                userId:
                  actor.id,
              },
            }
          );

        if (!provider) {
          return res.json({
            success: true,
            data: [],
          });
        }

        /*
         * Provider can see:
         *
         * 1. Their assigned orders.
         *
         * 2. New pending service requests
         *    matching their service category.
         *
         * The second condition lets providers
         * discover new work.
         */
        where = {
          OR: [
            {
              providerId:
                provider.id,
            },

            {
              status:
                'pending',

              type:
                'service',

              OR: [
                {
                  category:
                    provider.category,
                },

                {
                  category:
                    null,
                },
              ],
            },
          ],
        };
      }

      /*
       * DRIVER
       */
      else if (
        actor.role ===
        'driver'
      ) {
        const driver =
          await prisma.driver.findUnique(
            {
              where: {
                userId:
                  actor.id,
              },
            }
          );

        if (!driver) {
          return res.json({
            success: true,
            data: [],
          });
        }

        where = {
          driverId:
            driver.id,
        };
      }

      /*
       * MERCHANT
       *
       * Merchants should see orders belonging
       * to their own stores.
       */
      else if (
        actor.role ===
        'merchant'
      ) {
        const stores =
          await prisma.localStore.findMany(
            {
              where: {
                ownerId:
                  actor.id,
              },

              select: {
                id: true,
              },
            }
          );

        const storeIds =
          stores.map(
            (store) =>
              store.id
          );

        where = {
          storeId: {
            in: storeIds,
          },
        };
      }

      /*
       * ADMIN
       */
      else if (
        actor.role ===
        'admin'
      ) {
        where = {};
      }

      const orders =
        await prisma.order.findMany(
          {
            where,

            include:
              orderInclude,

            orderBy: {
              createdAt:
                'desc',
            },
          }
        );

      return res.json({
        success: true,

        data:
          orders.map(
            serializeOrder
          ),
      });
    } catch (error) {
      console.error(
        '[orders:list]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to load orders',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET /api/orders/:orderId
|--------------------------------------------------------------------------
|
| Explicit single-order authorization.
|
*/

router.get(
  '/:orderId',
  requireAuth(),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      const order =
        await prisma.order.findUnique(
          {
            where: {
              id:
                req.params.orderId,
            },

            include:
              orderInclude,
          }
        );

      if (!order) {
        return res.status(
          404
        ).json({
          success: false,
          error:
            'Order not found',
        });
      }

      const allowed =
        await canAccessOrder(
          actor,
          order
        );

      if (!allowed) {
        return res.status(
          403
        ).json({
          success: false,
          error:
            'You do not have access to this order',
        });
      }

      return res.json({
        success: true,
        data:
          serializeOrder(
            order
          ),
      });
    } catch (error) {
      console.error(
        '[orders:get]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to load order',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
|
| ONLY customers and admins may create customer orders.
|
| This is important:
|
| The browser is NOT trusted to tell us who the
| customer is.
|
| tenantUserId is always taken from req.user.id
| when a tenant creates an order.
|
*/

router.post(
  '/',
  requireAuth([
    'tenant',
    'admin',
  ]),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      const body =
        req.body ?? {};

      const type =
        body.type as OrderType;

      if (
        !isValidOrderType(
          type
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,
          error:
            'Invalid order type',
        });
      }

      /*
       * Required customer information.
       */
      if (
        !body.title ||
        !body.tenantAddress
      ) {
        return res.status(
          400
        ).json({
          success: false,
          error:
            'Title and service/delivery address are required',
        });
      }

      /*
       * Phone is allowed to be absent temporarily.
       *
       * We do not use a fake identity.
       */
      const tenantPhone =
        String(
          body.tenantPhone ||
            ''
        ).trim();

      /*
       * PROVIDER VALIDATION
       */
      let providerId:
        | string
        | null =
        null;

      if (
        type ===
          'service' &&
        body.providerId
      ) {
        const provider =
          await prisma.verifiedPro.findUnique(
            {
              where: {
                id:
                  String(
                    body.providerId
                  ),
              },
            }
          );

        if (!provider) {
          return res.status(
            400
          ).json({
            success: false,
            error:
              'Selected provider was not found',
          });
        }

        /*
         * Only verified providers should
         * receive customer bookings.
         */
        if (
          !provider.isVerified
        ) {
          return res.status(
            409
          ).json({
            success: false,
            error:
              'This provider is not yet verified',
          });
        }

        providerId =
          provider.id;
      }

      /*
       * DRIVER VALIDATION
       */
      let driverId:
        | string
        | null =
        null;

      if (
        body.driverId
      ) {
        const driver =
          await prisma.driver.findUnique(
            {
              where: {
                id:
                  String(
                    body.driverId
                  ),
              },
            }
          );

        if (!driver) {
          return res.status(
            400
          ).json({
            success: false,
            error:
              'Selected driver was not found',
          });
        }

        driverId =
          driver.id;
      }

      /*
       * STORE VALIDATION
       */
      let storeId:
        | string
        | null =
        null;

      if (
        body.storeId
      ) {
        const store =
          await prisma.localStore.findUnique(
            {
              where: {
                id:
                  String(
                    body.storeId
                  ),
              },
            }
          );

        if (!store) {
          return res.status(
            400
          ).json({
            success: false,
            error:
              'Selected store was not found',
          });
        }

        storeId =
          store.id;
      }

      /*
       * Numeric normalization.
       */
      const subtotal =
        isFiniteNumber(
          body.subtotal
        )
          ? Number(
              body.subtotal
            )
          : 0;

      const deliveryFee =
        isFiniteNumber(
          body.deliveryFee
        )
          ? Number(
              body.deliveryFee
            )
          : 0;

      const serviceFee =
        isFiniteNumber(
          body.serviceFee
        )
          ? Number(
              body.serviceFee
            )
          : 0;

      const tax =
        isFiniteNumber(
          body.tax
        )
          ? Number(
              body.tax
            )
          : 0;

      const total =
        isFiniteNumber(
          body.total
        )
          ? Number(
              body.total
            )
          : subtotal +
            deliveryFee +
            serviceFee +
            tax;

      const estimatedArrivalMin =
        isFiniteNumber(
          body.estimatedArrivalMin
        )
          ? Math.max(
              0,
              Math.round(
                Number(
                  body.estimatedArrivalMin
                )
              )
            )
          : 30;

      /*
       * Scheduled date.
       */
      let scheduledFor:
        | Date
        | null =
        null;

      if (
        body.scheduledFor &&
        !String(
          body.scheduledFor
        ).startsWith(
          'ASAP'
        )
      ) {
        const parsed =
          new Date(
            body.scheduledFor
          );

        if (
          !Number.isNaN(
            parsed.getTime()
          )
        ) {
          scheduledFor =
            parsed;
        }
      }

      /*
       * Status:
       *
       * A selected provider means the job is
       * assigned immediately.
       *
       * Otherwise it stays pending.
       */
      const initialStatus:
        OrderStatus =
        providerId ||
        driverId
          ? 'assigned'
          : 'pending';

      /*
       * SECURITY:
       *
       * For a normal customer order, the
       * authenticated user is ALWAYS the owner.
       */
      const tenantUserId =
        actor.role ===
        'tenant'
          ? actor.id
          : body.tenantUserId
            ? String(
                body.tenantUserId
              )
            : null;

      const created =
        await prisma.$transaction(
          async (tx) => {
            const order =
              await tx.order.create(
                {
                  data: {
                    type,

                    title:
                      String(
                        body.title
                      )
                        .trim()
                        .slice(
                          0,
                          160
                        ),

                    category:
                      body.category
                        ? String(
                            body.category
                          )
                        : null,

                    status:
                      initialStatus,

                    tenantUserId,

                    tenantName:
                      String(
                        body.tenantName ||
                          actor.name ||
                          actor.email.split(
                            '@'
                          )[0] ||
                          'Customer'
                      )
                        .trim()
                        .slice(
                          0,
                          120
                        ),

                    tenantPhone,

                    tenantAddress:
                      String(
                        body.tenantAddress
                      )
                        .trim()
                        .slice(
                          0,
                          250
                        ),

                    apartmentUnit:
                      body.apartmentUnit
                        ? String(
                            body.apartmentUnit
                          )
                            .trim()
                            .slice(
                              0,
                              80
                            )
                        : null,

                    providerId,

                    driverId,

                    storeId,

                    subtotal,

                    deliveryFee,

                    serviceFee,

                    tax,

                    total,

                    paymentMethod:
                      String(
                        body.paymentMethod ||
                          'cash'
                      ),

                    estimatedArrivalMin,

                    urgency:
                      String(
                        body.urgency ||
                          'normal'
                      ),

                    scheduledFor,

                    notes:
                      body.notes
                        ? String(
                            body.notes
                          )
                            .trim()
                            .slice(
                              0,
                              2000
                            )
                        : null,

                    tenantLat:
                      isFiniteNumber(
                        body.tenantLat
                      )
                        ? Number(
                            body.tenantLat
                          )
                        : null,

                    tenantLng:
                      isFiniteNumber(
                        body.tenantLng
                      )
                        ? Number(
                            body.tenantLng
                          )
                        : null,

                    originLat:
                      isFiniteNumber(
                        body.originLat
                      )
                        ? Number(
                            body.originLat
                          )
                        : null,

                    originLng:
                      isFiniteNumber(
                        body.originLng
                      )
                        ? Number(
                            body.originLng
                          )
                        : null,

                    currentLat:
                      isFiniteNumber(
                        body.currentLat
                      )
                        ? Number(
                            body.currentLat
                          )
                        : null,

                    currentLng:
                      isFiniteNumber(
                        body.currentLng
                      )
                        ? Number(
                            body.currentLng
                          )
                        : null,
                  },

                  include:
                    orderInclude,
                }
              );

            /*
             * Audit event.
             */
            await tx.orderEvent.create(
              {
                data: {
                  orderId:
                    order.id,

                  type:
                    'created',

                  payload: {
                    actorId:
                      actor.id,

                    actorRole:
                      actor.role,

                    providerId,

                    driverId,
                  },
                },
              }
            );

            /*
             * If provider/driver was selected at
             * creation time, record the assignment.
             */
            if (
              providerId
            ) {
              await tx.orderAssignment.create(
                {
                  data: {
                    orderId:
                      order.id,

                    proId:
                      providerId,

                    driverId,

                    assignedBy:
                      actor.id,
                  },
                }
              );

              await tx.orderEvent.create(
                {
                  data: {
                    orderId:
                      order.id,

                    type:
                      'assigned',

                    payload: {
                      providerId,

                      driverId,

                      actorId:
                        actor.id,

                      actorRole:
                        actor.role,
                    },
                  },
                }
              );
            }

            return order;
          }
        );

      return res.status(
        201
      ).json({
        success: true,
        data:
          serializeOrder(
            created
          ),
      });
    } catch (error) {
      console.error(
        '[orders:create]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to create order',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PROVIDER ACCEPT / ASSIGN
|--------------------------------------------------------------------------
|
| POST/PATCH:
| /api/orders/:orderId/assign
|
| A provider can accept a pending service request.
|
*/

router.patch(
  '/:orderId/assign',
  requireAuth([
    'provider',
    'admin',
  ]),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      const {
        orderId,
      } = req.params;

      const requestedProId =
        req.body?.proId
          ? String(
              req.body.proId
            )
          : null;

      const requestedDriverId =
        req.body?.driverId
          ? String(
              req.body.driverId
            )
          : null;

      const order =
        await prisma.order.findUnique(
          {
            where: {
              id: orderId,
            },
          }
        );

      if (!order) {
        return res.status(
          404
        ).json({
          success: false,
          error:
            'Order not found',
        });
      }

      if (
        order.status !==
        'pending'
      ) {
        return res.status(
          409
        ).json({
          success: false,
          error:
            `Order is already ${order.status}`,
        });
      }

      /*
       * PROVIDER:
       *
       * The provider must use their own
       * VerifiedPro record.
       */
      let providerId =
        requestedProId;

      if (
        actor.role ===
        'provider'
      ) {
        const own =
          await prisma.verifiedPro.findUnique(
            {
              where: {
                userId:
                  actor.id,
              },
            }
          );

        if (!own) {
          return res.status(
            404
          ).json({
            success: false,
            error:
              'Provider workspace not found',
          });
        }

        if (
          !own.isVerified
        ) {
          return res.status(
            403
          ).json({
            success: false,
            error:
              'Your provider profile is awaiting verification',
          });
        }

        providerId =
          own.id;
      }

      if (!providerId) {
        return res.status(
          400
        ).json({
          success: false,
          error:
            'Provider profile is required',
        });
      }

      const provider =
        await prisma.verifiedPro.findUnique(
          {
            where: {
              id:
                providerId,
            },
          }
        );

      if (!provider) {
        return res.status(
          404
        ).json({
          success: false,
          error:
            'Provider profile not found',
        });
      }

      if (
        !provider.isVerified
      ) {
        return res.status(
          403
        ).json({
          success: false,
          error:
            'Provider is not verified',
        });
      }

      /*
       * Category protection for service jobs.
       */
      if (
        order.type ===
          'service' &&
        order.category &&
        order.category !==
          provider.category
      ) {
        return res.status(
          409
        ).json({
          success: false,
          error:
            'Provider does not offer this service category',
        });
      }

      /*
       * Driver validation, when supplied.
       */
      if (
        requestedDriverId
      ) {
        const driver =
          await prisma.driver.findUnique(
            {
              where: {
                id:
                  requestedDriverId,
              },
            }
          );

        if (!driver) {
          return res.status(
            400
          ).json({
            success: false,
            error:
              'Driver not found',
          });
        }
      }

      const updated =
        await prisma.$transaction(
          async (tx) => {
            const next =
              await tx.order.update(
                {
                  where: {
                    id:
                      orderId,
                  },

                  data: {
                    providerId,

                    driverId:
                      requestedDriverId,

                    status:
                      'assigned',
                  },

                  include:
                    orderInclude,
                }
              );

            await tx.orderAssignment.create(
              {
                data: {
                  orderId,

                  proId:
                    providerId!,

                  driverId:
                    requestedDriverId,

                  assignedBy:
                    actor.id,
                },
              }
            );

            await tx.orderEvent.create(
              {
                data: {
                  orderId,

                  type:
                    'assigned',

                  payload: {
                    providerId,

                    driverId:
                      requestedDriverId,

                    actorId:
                      actor.id,

                    actorRole:
                      actor.role,
                  },
                },
              }
            );

            return next;
          }
        );

      return res.json({
        success: true,
        data:
          serializeOrder(
            updated
          ),
      });
    } catch (error) {
      console.error(
        '[orders:assign]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to assign order',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  '/:orderId/status',
  requireAuth([
    'provider',
    'driver',
    'admin',
  ]),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      const {
        orderId,
      } = req.params;

      const requestedStatus =
        req.body?.status as
          | OrderStatus
          | undefined;

      if (
        !requestedStatus ||
        !allowedStatuses.has(
          requestedStatus
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,
          error:
            'Invalid order status',
        });
      }

      const order =
        await prisma.order.findUnique(
          {
            where: {
              id:
                orderId,
            },
          }
        );

      if (!order) {
        return res.status(
          404
        ).json({
          success: false,
          error:
            'Order not found',
        });
      }

      /*
       * Provider authorization.
       */
      if (
        actor.role ===
        'provider'
      ) {
        const provider =
          await prisma.verifiedPro.findUnique(
            {
              where: {
                userId:
                  actor.id,
              },
            }
          );

        if (
          !provider ||
          order.providerId !==
            provider.id
        ) {
          return res.status(
            403
          ).json({
            success: false,
            error:
              'You are not assigned to this order',
          });
        }
      }

      /*
       * Driver authorization.
       */
      if (
        actor.role ===
        'driver'
      ) {
        const driver =
          await prisma.driver.findUnique(
            {
              where: {
                userId:
                  actor.id,
              },
            }
          );

        if (
          !driver ||
          order.driverId !==
            driver.id
        ) {
          return res.status(
            403
          ).json({
            success: false,
            error:
              'You are not assigned to this order',
          });
        }
      }

      /*
       * Completed/cancelled orders are final.
       */
      if (
        order.status ===
          'completed' ||
        order.status ===
          'cancelled'
      ) {
        return res.status(
          409
        ).json({
          success: false,
          error:
            `Completed or cancelled orders cannot be changed`,
        });
      }

      /*
       * Cancellation is always allowed for an
       * authorized provider/driver/admin.
       */
      if (
        requestedStatus !==
          'cancelled'
      ) {
        const current =
          statusIndex(
            order.status
          );

        const next =
          statusIndex(
            requestedStatus
          );

        /*
         * Status must move forward.
         */
        if (
          current >= 0 &&
          next < current
        ) {
          return res.status(
            409
          ).json({
            success: false,
            error:
              `Order status cannot move backwards from ${order.status} to ${requestedStatus}`,
          });
        }

        /*
         * Do not skip workflow steps.
         */
        if (
          current >= 0 &&
          next >
            current + 1
        ) {
          return res.status(
            409
          ).json({
            success: false,
            error:
              `Order must progress from ${order.status} to the next workflow step`,
          });
        }
      }

      const updated =
        await prisma.$transaction(
          async (tx) => {
            const next =
              await tx.order.update(
                {
                  where: {
                    id:
                      orderId,
                  },

                  data: {
                    status:
                      requestedStatus,
                  },

                  include:
                    orderInclude,
                }
              );

            await tx.orderEvent.create(
              {
                data: {
                  orderId,

                  type:
                    'status_change',

                  payload: {
                    from:
                      order.status,

                    to:
                      requestedStatus,

                    actorId:
                      actor.id,

                    actorRole:
                      actor.role,
                  },
                },
              }
            );

            /*
             * Keep provider lifetime job count
             * synchronized with completed orders.
             */
            if (
              requestedStatus ===
                'completed' &&
              order.providerId
            ) {
              await tx.verifiedPro.update(
                {
                  where: {
                    id:
                      order.providerId,
                  },

                  data: {
                    completedJobs: {
                      increment:
                        1,
                    },
                  },
                }
              );
            }

            return next;
          }
        );

      return res.json({
        success: true,
        data:
          serializeOrder(
            updated
          ),
      });
    } catch (error) {
      console.error(
        '[orders:status]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to update order status',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
*/

router.post(
  '/:orderId/messages',
  requireAuth(),
  async (
    req: AuthedRequest,
    res: Response
  ) => {
    try {
      const actor =
        req.user!;

      const {
        orderId,
      } = req.params;

      const text =
        String(
          req.body?.text ||
            ''
        )
          .trim()
          .slice(
            0,
            1000
          );

      if (!text) {
        return res.status(
          400
        ).json({
          success: false,
          error:
            'Message cannot be empty',
        });
      }

      const order =
        await prisma.order.findUnique(
          {
            where: {
              id:
                orderId,
            },
          }
        );

      if (!order) {
        return res.status(
          404
        ).json({
          success: false,
          error:
            'Order not found',
        });
      }

      const allowed =
        await canAccessOrder(
          actor,
          order
        );

      if (!allowed) {
        return res.status(
          403
        ).json({
          success: false,
          error:
            'You cannot message this order',
        });
      }

      const message =
        await prisma.$transaction(
          async (tx) => {
            const created =
              await tx.orderMessage.create(
                {
                  data: {
                    orderId,

                    sender:
                      actor.role,

                    senderName:
                      actor.name ||
                      actor.email,

                    text,
                  },
                }
              );

            await tx.orderEvent.create(
              {
                data: {
                  orderId,

                  type:
                    'message',

                  payload: {
                    messageId:
                      created.id,

                    actorId:
                      actor.id,

                    actorRole:
                      actor.role,
                  },
                },
              }
            );

            return created;
          }
        );

      return res.status(
        201
      ).json({
        success: true,

        data: {
          id:
            message.id,

          sender:
            message.sender,

          senderName:
            message.senderName,

          text:
            message.text,

          timestamp:
            message.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(
        '[orders:message]',
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        error:
          'Failed to send message',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ACCESS CONTROL
|--------------------------------------------------------------------------
*/

async function canAccessOrder(
  actor: NonNullable<
    AuthedRequest['user']
  >,
  order: any
): Promise<boolean> {
  /*
   * Admin.
   */
  if (
    actor.role ===
    'admin'
  ) {
    return true;
  }

  /*
   * Customer.
   */
  if (
    actor.role ===
    'tenant'
  ) {
    return (
      order.tenantUserId ===
      actor.id
    );
  }

  /*
   * Provider.
   */
  if (
    actor.role ===
    'provider'
  ) {
    const provider =
      await prisma.verifiedPro.findUnique(
        {
          where: {
            userId:
              actor.id,
          },

          select: {
            id: true,
          },
        }
      );

    return Boolean(
      provider &&
        order.providerId ===
          provider.id
    );
  }

  /*
   * Driver.
   */
  if (
    actor.role ===
    'driver'
  ) {
    const driver =
      await prisma.driver.findUnique(
        {
          where: {
            userId:
              actor.id,
          },

          select: {
            id: true,
          },
        }
      );

    return Boolean(
      driver &&
        order.driverId ===
          driver.id
    );
  }

  /*
   * Merchant.
   */
  if (
    actor.role ===
    'merchant'
  ) {
    if (!order.storeId) {
      return false;
    }

    const store =
      await prisma.localStore.findFirst(
        {
          where: {
            id:
              order.storeId,

            ownerId:
              actor.id,
          },

          select: {
            id: true,
          },
        }
      );

    return Boolean(
      store
    );
  }

  return false;
}

export default router;