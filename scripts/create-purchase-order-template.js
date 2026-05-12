/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const JSZip = require("jszip");

const outputPath = path.join(
  process.cwd(),
  "templates",
  "purchase-order-template.docx",
);

async function main() {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
  );

  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
  );

  zip.folder("docProps").file(
    "app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
</Properties>`,
  );

  zip.folder("docProps").file(
    "core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Bon de commande client</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-05-12T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-12T00:00:00Z</dcterms:modified>
</cp:coreProperties>`,
  );

  zip.folder("word").folder("_rels").file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships" />`,
  );

  zip.folder("word").file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>BON DE COMMANDE</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Fournisseur : </w:t></w:r><w:r><w:t>+++INS nomFournisseur+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Client : </w:t></w:r><w:r><w:t>+++INS nomClient != null ? nomClient : ''+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Reference devis : </w:t></w:r><w:r><w:t>+++INS numeroDevis != null ? numeroDevis : ''+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Date du devis : </w:t></w:r><w:r><w:t>+++INS dateDevis != null ? dateDevis : ''+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Validite : </w:t></w:r><w:r><w:t>+++INS validiteDevis != null ? validiteDevis : ''+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Total HT : </w:t></w:r><w:r><w:t>+++INS montantTotalHT != null ? montantTotalHT : ''+++</w:t></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t>+++INS devise+++</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">Total TTC : </w:t></w:r><w:r><w:t>+++INS montantTotalTTC != null ? montantTotalTTC : ''+++</w:t></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t>+++INS devise+++</w:t></w:r></w:p>
    <w:p><w:r><w:t>Resume :</w:t></w:r></w:p>
    <w:p><w:r><w:t>+++INS resume != null ? resume : ''+++</w:t></w:r></w:p>
    <w:p><w:r><w:t>Lignes du devis :</w:t></w:r></w:p>
    <w:p><w:r><w:t>+++FOR ligne IN lignes+++</w:t></w:r></w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">- </w:t></w:r>
      <w:r><w:t>+++INS $ligne.description+++</w:t></w:r>
      <w:r><w:t xml:space="preserve"> | Quantite : </w:t></w:r>
      <w:r><w:t>+++INS $ligne.quantite != null ? $ligne.quantite : ''+++</w:t></w:r>
      <w:r><w:t xml:space="preserve"> | Prix unitaire : </w:t></w:r>
      <w:r><w:t>+++INS $ligne.prixUnitaire != null ? $ligne.prixUnitaire : ''+++</w:t></w:r>
      <w:r><w:t xml:space="preserve"> | Total : </w:t></w:r>
      <w:r><w:t>+++INS $ligne.totalLigne != null ? $ligne.totalLigne : ''+++</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>+++END-FOR ligne+++</w:t></w:r></w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" />
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0" />
    </w:sectPr>
  </w:body>
</w:document>`,
  );

  const buffer = await zip.generateAsync({
    compression: "DEFLATE",
    type: "nodebuffer",
  });

  fs.writeFileSync(outputPath, buffer);
  console.log(`Template written to ${outputPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
