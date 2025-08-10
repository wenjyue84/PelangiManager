// Unit test for gender-based capsule selection helper

function sortCapsulesForFemale(caps: string[]): string[] {
  const enriched = caps.map(n => ({
    n,
    num: parseInt(n.replace(/^[A-Z]/, '')),
    section: n.startsWith('C') && parseInt(n.replace('C','')) <= 6 ? 'back' : (n.startsWith('C') ? 'front' : 'front')
  }));
  return enriched
    .filter(c => c.section === 'back')
    .sort((a, b) => a.num - b.num)
    .map(c => c.n);
}

describe("Capsule assignment", () => {
  it("prefers back section for female when available", () => {
    const result = sortCapsulesForFemale(["C1","C4","C11","C12"]);
    expect(result[0]).toBe("C1");
  });
});


