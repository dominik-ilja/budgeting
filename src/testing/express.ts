import type { Request, Response } from "express";

export function createMockRequest(opts: any) {
  return opts as unknown as Request;
}
export function createMockResponse(opts: any) {
  return opts as unknown as Response;
}
