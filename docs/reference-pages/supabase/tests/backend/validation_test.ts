import { assertEquals, assertFalse } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  ErrorResponseSchema,
  MatchIdSchema,
  SuccessResponseSchema,
  validateRequest,
} from "../../functions/_shared/validation.ts";

Deno.test("validateRequest accepts valid match identifiers", () => {
  const result = validateRequest(MatchIdSchema, {
    matchId: "00000000-0000-0000-0000-000000000000",
  });

  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data.matchId, "00000000-0000-0000-0000-000000000000");
  }
});

Deno.test("validateRequest rejects malformed match identifiers", () => {
  const result = validateRequest(MatchIdSchema, { matchId: "not-a-uuid" });

  assertFalse(result.success);
  if (!result.success) {
    assertEquals(result.error, "Invalid input data");
    assertEquals(result.details[0].field, "matchId");
  }
});

Deno.test("ErrorResponseSchema enforces structure", () => {
  const parsed = ErrorResponseSchema.parse({
    error: "Invalid input",
    details: [{ field: "matchId", message: "Invalid UUID", code: "invalid_string" }],
  });

  assertEquals(parsed.error, "Invalid input");
});

Deno.test("SuccessResponseSchema allows optional payload", () => {
  const parsed = SuccessResponseSchema.parse({
    success: true,
    data: { ok: true },
    message: "Test",
  });

  assertEquals(parsed.success, true);
  assertEquals(parsed.data, { ok: true });
  assertEquals(parsed.message, "Test");
});
