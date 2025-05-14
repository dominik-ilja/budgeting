import type { Request, Response } from "express";

type SetValuesToAny<T> = {
  [K in keyof T]: any;
};

type MockRequest = SetValuesToAny<Partial<Request>>;
type MockResponse = SetValuesToAny<Partial<Response>>;

export function createMockRequest(opts: MockRequest) {
  return opts as unknown as Request;
}
export function createMockResponse(opts: MockResponse) {
  return opts as unknown as Response;
}
