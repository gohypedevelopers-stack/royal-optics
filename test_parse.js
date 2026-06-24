const description = `BRAND:-	Stinic TR
MODEL:-	303
CATEGORY:-	Eyewear
SUTABLE ON:-	Teen
SUTABLE FACE:-	Ovel Shape
FRAME SHAPE:-	Rectangle
FRAME TYPE:-	Basic TR
FRAME FRONT SIZE:-	135mm
LENS SIZE:-	50mm 
RIM HEIGHT:-	35mm
NOSE BIRGE:-	18 mm
SIDE LENGTH:-	140mm
WEIGHT TYPE:-	Ultra Light
FRONT COLOR:-	Brown
SIDE COLOR:-	Brown
SIDE WITH SPRING:-	Yes
WARRANTY:-	6 Months`;

function parseDescriptionTable(description) {
  const normalized = description.replace(/:\s*-/g, ":").replace(/\s+/g, " ").trim();
  console.log("normalized:", normalized);
  if (!normalized.includes(":")) {
    return [];
  }

  const matches = Array.from(normalized.matchAll(/([A-Za-z][A-Za-z0-9 /_]+):\s*/g));
  if (matches.length <= 1) {
    return [];
  }

  return matches
    .map((match, index) => {
      const nextMatch = matches[index + 1];
      const valueStart = match.index + match[0].length;
      const valueEnd = nextMatch ? nextMatch.index : normalized.length;
      const value = normalized.slice(valueStart, valueEnd).trim();
      return {
        key: match[1].trim(),
        value: value || "-",
      };
    })
    .filter((item) => item.key);
}

console.log(parseDescriptionTable(description));
