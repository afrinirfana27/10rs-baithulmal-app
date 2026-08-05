import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { inr } from "@/lib/api";

const BRAND = { moss: [36, 79, 53], copper: [198, 122, 61], text: [26, 33, 28] };

export function generatePdf({ title, subtitle, sections }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...BRAND.moss);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(253, 251, 247);
  doc.text("10₹ Baithulmal", 40, 32);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 40, 52);
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 40, 64);
  }

  // Copper accent
  doc.setFillColor(...BRAND.copper);
  doc.rect(0, 70, pageW, 3, "F");

  let y = 100;
  sections.forEach((sec) => {
    doc.setTextColor(...BRAND.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(sec.heading, 40, y);
    y += 8;

    if (sec.rows && sec.rows.length) {
      autoTable(doc, {
        startY: y + 4,
        head: [sec.columns],
        body: sec.rows,
        theme: "grid",
        headStyles: { fillColor: BRAND.moss, textColor: [253, 251, 247], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 5, textColor: BRAND.text },
        alternateRowStyles: { fillColor: [246, 243, 235] },
        margin: { left: 40, right: 40 },
      });
      y = doc.lastAutoTable.finalY + 24;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("No records.", 40, y + 16);
      y += 32;
    }

    if (sec.total !== undefined) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND.copper);
      doc.text(`Total: ${inr(sec.total)}`, 40, y);
      y += 24;
    }

    if (y > 720) { doc.addPage(); y = 60; }
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generated ${new Date().toLocaleString()} · Page ${i} of ${pages}`, 40, 820);
  }

  return doc;
}

export function downloadPdf(doc, filename = "report.pdf") {
  doc.save(filename);
}

export function shareWhatsApp(message) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
