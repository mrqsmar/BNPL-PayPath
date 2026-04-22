import { Router, Request, Response } from "express";
import "../types";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;
    res.json({ success: true });
    return;
  }

  res.status(401).json({ error: "Invalid credentials" });
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.json({ success: true });
  });
});

router.get("/me", (req: Request, res: Response) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

export default router;
