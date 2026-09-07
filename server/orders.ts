import express, { Router, Request, Response } from 'express';

export default function createOrdersRouter(prisma: any, authMiddleware: any) {
  const router: Router = express.Router();

  // Assign endpoint
  router.patch('/:orderId/assign', authMiddleware(['provider','admin']), async (req: Request & { user?: any }, res: Response) => {
    try {
      const { orderId } = req.params;
      const { proId, driverId } = req.body;
      const actor = req.user;
      if (!actor) return res.status(401).json({ success: false, error: 'Not authenticated' });
      if (!proId) return res.status(400).json({ success: false, error: 'proId is required' });

      const updated = await prisma.$transaction(async (tx: any) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('Order not found');
        if (order.status !== 'pending') throw new Error(`Order is not pending (status=${order.status})`);

        const up = await tx.order.update({ where: { id: orderId }, data: { providerId: proId, driverId: driverId || null, status: 'assigned' } });

        await tx.orderAssignment.create({ data: { orderId, proId, driverId: driverId || null, assignedBy: actor.id } });

        await tx.orderEvent.create({ data: { orderId, type: 'assigned', payload: { proId, driverId, assignedBy: actor.id } } });

        return up;
      });

      return res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Assign error:', err);
      return res.status(400).json({ success: false, error: err?.message || 'Assign failed' });
    }
  });

  // Status update endpoint
  router.patch('/:orderId/status', authMiddleware(['provider','driver','admin']), async (req: Request & { user?: any }, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const actor = req.user;
      if (!actor) return res.status(401).json({ success: false, error: 'Not authenticated' });
      if (!status) return res.status(400).json({ success: false, error: 'status is required' });

      const valid = ['pending','assigned','en_route','arrived','in_progress','completed','cancelled'];
      if (!valid.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      // Authorization checks
      if (actor.role === 'driver' && order.driverId !== actor.id) return res.status(403).json({ success: false, error: 'Forbidden' });
      if (actor.role === 'provider' && order.providerId !== actor.id) return res.status(403).json({ success: false, error: 'Forbidden' });

      // Transition validation
      const seq = ['pending','assigned','en_route','arrived','in_progress','completed'];
      const curIdx = seq.indexOf(order.status);
      const nextIdx = seq.indexOf(status);
      if (nextIdx < curIdx && status !== 'cancelled') return res.status(400).json({ success: false, error: 'Invalid transition' });

      const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });

      await prisma.orderEvent.create({ data: { orderId, type: 'status_change', payload: { from: order.status, to: status, actorId: actor.id } } });

      return res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Status update error:', err);
      return res.status(400).json({ success: false, error: err?.message || 'Failed to update status' });
    }
  });

  return router;
}
