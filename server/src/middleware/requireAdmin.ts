import { Request, Response, NextFunction } from "express";
import "../types";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin === true) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}
