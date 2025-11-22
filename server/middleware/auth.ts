import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.session?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = userId;
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAdmin = req.session?.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  next();
}
