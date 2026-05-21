import { Elysia } from "elysia";
import { ZodError } from "zod";
import { DomainError } from "../../../application/errors/domain-errors";
import type { ApiError } from "@medexplorer/shared";

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ error, set }) => {
    if (error instanceof DomainError) {
      set.status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : 400;
      const body: ApiError = {
        error: { code: error.code, message: error.message, details: error.details },
      };
      return body;
    }
    if (error instanceof ZodError) {
      set.status = 400;
      const body: ApiError = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
        },
      };
      return body;
    }
    // Elysia built-in error codes (NOT_FOUND when no route matches, etc.)
    const elysiaCode = (error as { code?: string })?.code;
    if (elysiaCode === "NOT_FOUND") {
      set.status = 404;
      const body: ApiError = {
        error: { code: "NOT_FOUND", message: "Route not found" },
      };
      return body;
    }
    if (elysiaCode === "VALIDATION") {
      set.status = 400;
      const body: ApiError = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: (error as { all?: unknown }).all,
        },
      };
      return body;
    }
    if (elysiaCode === "PARSE") {
      set.status = 400;
      const body: ApiError = {
        error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
      };
      return body;
    }
    console.error("Unhandled error:", error);
    set.status = 500;
    const body: ApiError = {
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    };
    return body;
  },
);
