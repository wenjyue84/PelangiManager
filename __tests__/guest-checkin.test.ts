import { insertGuestSchema } from "@shared/schema";

describe("Guest check-in schema", () => {
  it("accepts minimum valid guest", () => {
    const parsed = insertGuestSchema.parse({
      name: "Guest1",
      capsuleNumber: "C1",
      paymentAmount: "45",
      paymentMethod: "cash",
      paymentCollector: "Admin",
      expectedCheckoutDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
    });
    expect(parsed.name).toBe("Guest1");
  });

  it("rejects invalid capsule format", () => {
    expect(() => insertGuestSchema.parse({
      name: "Guest2",
      capsuleNumber: "ZZZ",
      paymentAmount: "45",
      paymentMethod: "cash",
      paymentCollector: "Admin",
      expectedCheckoutDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
    })).toThrow();
  });
});


