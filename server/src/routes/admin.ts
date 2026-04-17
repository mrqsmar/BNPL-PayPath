import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../index";

const router = Router();

router.use(requireAdmin);

router.get("/invoices", async (_req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadBatch: true },
  });
  res.json(invoices);
});

router.get("/batches", async (_req: Request, res: Response) => {
  const batches = await prisma.uploadBatch.findMany({
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });
  res.json(batches);
});

router.get("/invoices/:id", async (req: Request<{ id: string }>, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(req.params.id as string) },
    include: { messages: true, uploadBatch: true },
  });

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(invoice);
});

export default router;
