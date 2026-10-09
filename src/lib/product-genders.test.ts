import assert from "node:assert/strict";
import test from "node:test";
import { genderOptions, parseProductGenders, productGenderFilter } from "./product-genders";
import { productSchema } from "./validators";

test("existing and empty gender values remain compatible", () => {
  assert.deepEqual(parseProductGenders(null), []);
  assert.deepEqual(parseProductGenders(""), []);
  assert.deepEqual(parseProductGenders("unisex"), ["unisex"]);
  assert.deepEqual(parseProductGenders("men,women"), ["men", "women"]);
});

test("every gender combination validates and matches only its selected categories", () => {
  const values = genderOptions.map(({ value }) => value);
  for (let mask = 0; mask < 1 << values.length; mask++) {
    const selected = values.filter((_, index) => mask & (1 << index));
    const stored = productSchema.shape.gender.parse(selected.join(",")) || null;
    assert.deepEqual(parseProductGenders(stored), selected);
    for (const value of values) {
      const filter = productGenderFilter(value);
      const matches = filter.OR!.some(({ gender }) => {
        if (typeof gender === "string") return stored === gender;
        if (!stored || !gender) return false;
        if (typeof gender.startsWith === "string") return stored.startsWith(gender.startsWith);
        if (typeof gender.endsWith === "string") return stored.endsWith(gender.endsWith);
        if (typeof gender.contains === "string") return stored.includes(gender.contains);
        return false;
      });
      assert.equal(matches, selected.includes(value), `${stored} filtered by ${value}`);
    }
  }
});

test("invalid gender selections are rejected", () => {
  for (const value of ["none", "men,unknown", "women,", "menwomen"]) {
    assert.equal(productSchema.shape.gender.safeParse(value).success, false);
  }
});
