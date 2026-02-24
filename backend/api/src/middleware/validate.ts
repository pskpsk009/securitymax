import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 * On failure it returns a 400 with structured error details.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: err.issues.map((e: any) => ({
            field: (e.path ?? []).join("."),
            message: String(e.message ?? ""),
          })),
        });
        return;
      }
      next(err);
    }
  };
