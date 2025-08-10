import { insertGuestSchema } from "@shared/schema";

describe("Payments", () => {
  it("accepts preset amounts", () => {
    ["45","48","650"].forEach(amount => {
      const parsed = insertGuestSchema.parse({
        name: "GuestP",
        capsuleNumber: "C2",
        paymentAmount: amount,
        paymentMethod: "cash",
        paymentCollector: "Admin",
        expectedCheckoutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      });
      expect(parsed.paymentAmount).toBe(amount);
    })
  });
});


