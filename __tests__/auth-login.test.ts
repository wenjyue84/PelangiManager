import { loginSchema } from "@shared/schema";

describe("Authentication: login schema", () => {
  it("accepts valid email + password", () => {
    const parsed = loginSchema.parse({ email: "admin@pelangi.com", password: "StrongPass1" });
    expect(parsed.email).toBe("admin@pelangi.com");
  });

  it("accepts username in email field (server allows username login)", () => {
    const parsed = loginSchema.parse({ email: "admin", password: "StrongPass1" });
    expect(parsed.email).toBe("admin");
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "user@example.com", password: "" })).toThrow();
  });
});


