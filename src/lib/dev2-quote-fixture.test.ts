import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ressembleAUnDevisFournisseur } from "@/lib/extraction";

const fixturePath = path.resolve(process.cwd(), "test/fixtures/dev2-ocr.txt");

describe("dev2 OCR fixture", () => {
  it("correspond bien au corpus de devis choisi", () => {
    const texteOcr = readFileSync(fixturePath, "utf8");

    expect(ressembleAUnDevisFournisseur(texteOcr)).toBe(true);
    expect(texteOcr).toContain("DEVIS");
    expect(texteOcr).toContain("Validité du devis");
    expect(texteOcr).toContain("CÉLIA NAUDIN");
  });
});
