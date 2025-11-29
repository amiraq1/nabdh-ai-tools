import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Supplier, Transaction } from "@shared/schema";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("ar-SA");
};

export function exportSuppliersToExcel(suppliers: Supplier[], filename = "الموردين") {
  const data = suppliers.map((s) => ({
    "الاسم": s.name,
    "الهاتف": s.phone || "-",
    "البريد الإلكتروني": s.email || "-",
    "العنوان": s.address || "-",
    "الفئة": s.category,
    "الرصيد": s.balance,
    "ملاحظات": s.notes || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الموردين");
  
  ws["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
  ];

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  suppliers: Supplier[],
  filename = "المعاملات"
) {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));
  
  const data = transactions.map((t) => ({
    "التاريخ": t.date,
    "المورد": supplierMap.get(t.supplierId) || "-",
    "النوع": t.type === "debit" ? "مشتريات (له)" : "دفعة (منه)",
    "المبلغ": t.amount,
    "الوصف": t.description || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المعاملات");
  
  ws["!cols"] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 40 },
  ];

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportSuppliersToPDF(suppliers: Supplier[], filename = "الموردين") {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.addFont("https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6bs61A.ttf", "IBMPlexArabic", "normal");
  doc.setFont("IBMPlexArabic");
  
  doc.setFontSize(18);
  doc.text("تقرير الموردين", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`, doc.internal.pageSize.getWidth() - 15, 25, { align: "right" });

  const tableData = suppliers.map((s) => [
    s.notes || "-",
    formatCurrency(s.balance),
    s.category,
    s.phone || "-",
    s.name,
  ]);

  doc.autoTable({
    head: [["ملاحظات", "الرصيد", "الفئة", "الهاتف", "الاسم"]],
    body: tableData,
    startY: 35,
    styles: {
      font: "helvetica",
      halign: "right",
      fontSize: 10,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 50 },
    },
  });

  const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(12);
  doc.text(`إجمالي الأرصدة: ${formatCurrency(totalBalance)}`, doc.internal.pageSize.getWidth() - 15, finalY + 15, { align: "right" });
  doc.text(`عدد الموردين: ${suppliers.length}`, doc.internal.pageSize.getWidth() - 15, finalY + 25, { align: "right" });

  doc.save(`${filename}.pdf`);
}

export function exportTransactionsToPDF(
  transactions: Transaction[],
  suppliers: Supplier[],
  filename = "المعاملات"
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(18);
  doc.text("تقرير المعاملات", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`, doc.internal.pageSize.getWidth() - 15, 25, { align: "right" });

  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const tableData = transactions.map((t) => [
    t.description || "-",
    formatCurrency(t.amount),
    t.type === "debit" ? "مشتريات (له)" : "دفعة (منه)",
    supplierMap.get(t.supplierId) || "-",
    formatDate(t.date),
  ]);

  doc.autoTable({
    head: [["الوصف", "المبلغ", "النوع", "المورد", "التاريخ"]],
    body: tableData,
    startY: 35,
    styles: {
      font: "helvetica",
      halign: "right",
      fontSize: 10,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
    },
  });

  const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  
  doc.setFontSize(12);
  doc.text(`إجمالي المشتريات: ${formatCurrency(totalDebits)}`, doc.internal.pageSize.getWidth() - 15, finalY + 15, { align: "right" });
  doc.text(`إجمالي الدفعات: ${formatCurrency(totalCredits)}`, doc.internal.pageSize.getWidth() - 15, finalY + 25, { align: "right" });
  doc.text(`عدد المعاملات: ${transactions.length}`, doc.internal.pageSize.getWidth() - 15, finalY + 35, { align: "right" });

  doc.save(`${filename}.pdf`);
}

export function exportSupplierReportToPDF(
  supplier: Supplier,
  transactions: Transaction[],
  filename?: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(18);
  doc.text(`كشف حساب: ${supplier.name}`, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`, doc.internal.pageSize.getWidth() - 15, 25, { align: "right" });

  doc.setFontSize(12);
  let yPos = 40;
  
  doc.text(`الهاتف: ${supplier.phone || "-"}`, doc.internal.pageSize.getWidth() - 15, yPos, { align: "right" });
  yPos += 8;
  doc.text(`الفئة: ${supplier.category}`, doc.internal.pageSize.getWidth() - 15, yPos, { align: "right" });
  yPos += 8;
  doc.text(`الرصيد الحالي: ${formatCurrency(supplier.balance)}`, doc.internal.pageSize.getWidth() - 15, yPos, { align: "right" });
  yPos += 15;

  if (transactions.length > 0) {
    const tableData = transactions.map((t) => [
      t.description || "-",
      formatCurrency(t.amount),
      t.type === "debit" ? "له" : "منه",
      formatDate(t.date),
    ]);

    doc.autoTable({
      head: [["الوصف", "المبلغ", "النوع", "التاريخ"]],
      body: tableData,
      startY: yPos,
      styles: {
        font: "helvetica",
        halign: "right",
        fontSize: 10,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
    const finalY = (doc as any).lastAutoTable.finalY || yPos;
    
    doc.setFontSize(11);
    doc.text(`إجمالي المشتريات: ${formatCurrency(totalDebits)}`, doc.internal.pageSize.getWidth() - 15, finalY + 12, { align: "right" });
    doc.text(`إجمالي الدفعات: ${formatCurrency(totalCredits)}`, doc.internal.pageSize.getWidth() - 15, finalY + 20, { align: "right" });
  } else {
    doc.text("لا توجد معاملات لهذا المورد", doc.internal.pageSize.getWidth() / 2, yPos + 10, { align: "center" });
  }

  doc.save(`${filename || `كشف_حساب_${supplier.name}`}.pdf`);
}
