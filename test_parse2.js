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
  if (!description.includes(":")) {
    return [];
  }

  const lines = description.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const result = [];
  
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*-?\s*(.*)$/);
    if (match) {
      result.push({
        key: match[1].trim(),
        value: match[2].trim() || "-",
      });
    } else {
      if (result.length > 0) {
         result[result.length - 1].value += " " + line;
      }
    }
  }

  if (result.length > 1) {
    return result;
  }
  
  return [];
}

console.log(parseDescriptionTable(description));
