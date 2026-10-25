import type { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
