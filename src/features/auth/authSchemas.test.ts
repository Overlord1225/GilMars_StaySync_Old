import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./authSchemas";

describe("login schema", () => {
  it("accepts a valid email and nonempty password", () => {
    expect(
      loginSchema.safeParse({ email: "guest@example.com", password: "secret" })
        .success,
    ).toBe(true);
  });

  it("rejects invalid email and empty password", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "" }).success,
    ).toBe(false);
  });
});

describe("registration schema", () => {
  const valid = {
    fullName: "Juan Dela Cruz",
    email: "juan@example.com",
    password: "strong-password",
    confirmPassword: "strong-password",
  };

  it("accepts registration without a contact number", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "another-password" })
        .success,
    ).toBe(false);
  });
});
