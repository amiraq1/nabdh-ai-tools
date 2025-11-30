import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import type { Supplier, Transaction } from "@shared/schema";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import AmiriFont from "./fonts/amiri-font";

// تسجيل الخطوط مع خط Amiri العربي
const pdfMakeInstance = (pdfMake as any).default ?? pdfMake;
const baseVfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs || {};
const customVfs = {
  ...baseVfs,
  "Amiri-Regular.ttf": AmiriFont,
  "Amiri-Bold.ttf": AmiriFont,
  "Amiri-Italic.ttf": AmiriFont,
  "Amiri-BoldItalic.ttf": AmiriFont
};

// تعريف الخطوط المتاحة
const customFonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  },
  Amiri: {
    normal: "Amiri-Regular.ttf",
    bold: "Amiri-Bold.ttf",
    italics: "Amiri-Italic.ttf",
    bolditalics: "Amiri-BoldItalic.ttf"
  }
};

// تسجيل VFS والخطوط
pdfMakeInstance.vfs = customVfs;
pdfMakeInstance.fonts = customFonts;

// دالة للتحقق من وجود أحرف عربية
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

// دالة لعكس ترتيب الكلمات للنص العربي RTL
// pdfmake لا يدعم RTL بشكل أصلي، لذا نحتاج لعكس الكلمات يدوياً
function rtl(text: string): string {
  if (!text || text === "-") return text;
  
  // إذا لم يحتوي على نص عربي، أرجعه كما هو
  if (!containsArabic(text)) return text;
  
  // معالجة خاصة للنصوص التي تحتوي على نقطتين (:)
  // مثل "كشف حساب: كرار" يجب أن تعكس كـ "كرار :كشف حساب"
  // ثم تصبح في PDF "كشف حساب: كرار" بالترتيب الصحيح
  
  // فصل النص إلى كلمات مع الحفاظ على المسافات
  const words = text.split(/(\s+)/);
  
  // عكس ترتيب الكلمات (مع الحفاظ على المسافات في مكانها)
  const nonSpaceWords: string[] = [];
  const spacePositions: { index: number; space: string }[] = [];
  
  words.forEach((word, index) => {
    if (/^\s+$/.test(word)) {
      spacePositions.push({ index: nonSpaceWords.length, space: word });
    } else if (word) {
      nonSpaceWords.push(word);
    }
  });
  
  // عكس الكلمات
  nonSpaceWords.reverse();
  
  // إعادة بناء النص
  let result = '';
  let wordIndex = 0;
  
  for (let i = 0; i <= nonSpaceWords.length; i++) {
    // إضافة المسافات في موقعها الأصلي (لكن من النهاية)
    const spaces = spacePositions.filter(sp => sp.index === nonSpaceWords.length - i);
    spaces.forEach(sp => {
      if (i > 0) result += sp.space;
    });
    
    if (i < nonSpaceWords.length) {
      result += nonSpaceWords[i];
      if (i < nonSpaceWords.length - 1 && !spacePositions.some(sp => sp.index === nonSpaceWords.length - i - 1)) {
        result += ' ';
      }
    }
  }
  
  // طريقة أبسط: عكس الكلمات مع مسافة واحدة بينها
  const simpleReverse = text.trim().split(/\s+/).reverse().join(' ');
  
  return simpleReverse;
}

// دالة مساعدة لإنشاء PDF مع الخطوط العربية
function createArabicPdf(docDefinition: TDocumentDefinitions) {
  return pdfMakeInstance.createPdf(docDefinition, undefined, customFonts, customVfs);
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 0,
  }).format(amount);
};

// تحويل الأرقام إلى كلمات عربية
const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function convertHundreds(num: number): string {
  if (num === 0) return "";
  if (num < 20) return ones[num];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one === 0) return tens[ten];
    return ones[one] + " و" + tens[ten];
  }
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  if (remainder === 0) return hundreds[hundred];
  return hundreds[hundred] + " و" + convertHundreds(remainder);
}

export function numberToArabicWords(num: number): string {
  if (num === 0) return "صفر دينار عراقي";
  
  const absNum = Math.abs(num);
  const isNegative = num < 0;
  
  let result = "";
  
  if (absNum >= 1000000000) {
    const billions = Math.floor(absNum / 1000000000);
    if (billions === 1) {
      result += "مليار";
    } else if (billions === 2) {
      result += "ملياران";
    } else if (billions >= 3 && billions <= 10) {
      result += convertHundreds(billions) + " مليارات";
    } else {
      result += convertHundreds(billions) + " مليار";
    }
  }
  
  const millions = Math.floor((absNum % 1000000000) / 1000000);
  if (millions > 0) {
    if (result) result += " و";
    if (millions === 1) {
      result += "مليون";
    } else if (millions === 2) {
      result += "مليونان";
    } else if (millions >= 3 && millions <= 10) {
      result += convertHundreds(millions) + " ملايين";
    } else {
      result += convertHundreds(millions) + " مليون";
    }
  }
  
  const thousands = Math.floor((absNum % 1000000) / 1000);
  if (thousands > 0) {
    if (result) result += " و";
    if (thousands === 1) {
      result += "ألف";
    } else if (thousands === 2) {
      result += "ألفان";
    } else if (thousands >= 3 && thousands <= 10) {
      result += convertHundreds(thousands) + " آلاف";
    } else {
      result += convertHundreds(thousands) + " ألف";
    }
  }
  
  const remainder = absNum % 1000;
  if (remainder > 0) {
    if (result) result += " و";
    result += convertHundreds(remainder);
  }
  
  result += " دينار عراقي";
  
  if (isNegative) {
    result = "سالب " + result;
  }
  
  return result;
}

export function formatCurrencyWithWords(amount: number): { numeric: string; words: string } {
  return {
    numeric: new Intl.NumberFormat("ar-IQ").format(amount) + " د.ع",
    words: numberToArabicWords(amount)
  };
}

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

// دالة مساعدة لإنشاء خلية جدول RTL
function rtlCell(text: string, options: Record<string, any> = {}): TableCell {
  return {
    text: rtl(text),
    alignment: "right",
    ...options
  } as TableCell;
}

// دالة مساعدة لإنشاء صف رأس الجدول
function headerRow(cells: string[]): TableCell[] {
  return cells.map(text => rtlCell(text, { 
    fillColor: "#3B82F6", 
    color: "#FFFFFF",
    bold: true,
    margin: [5, 8, 5, 8]
  }));
}

// دالة مساعدة لإنشاء صف بيانات
function dataRow(cells: string[], isAlternate: boolean): TableCell[] {
  return cells.map(text => rtlCell(text, { 
    fillColor: isAlternate ? "#F5F7FA" : "#FFFFFF",
    margin: [5, 6, 5, 6]
  }));
}

export function exportSuppliersToPDF(suppliers: Supplier[], filename = "الموردين") {
  const tableBody: TableCell[][] = [
    headerRow(["ملاحظات", "الرصيد", "الفئة", "الهاتف", "الاسم"])
  ];

  suppliers.forEach((s, index) => {
    tableBody.push(dataRow([
      s.notes || "-",
      formatCurrency(s.balance),
      s.category,
      s.phone || "-",
      s.name
    ], index % 2 === 1));
  });

  const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: "landscape",
    pageSize: "A4",
    content: [
      {
        text: rtl("تقرير الموردين"),
        style: "header",
        alignment: "center",
        margin: [0, 0, 0, 10]
      },
      {
        text: rtl(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`),
        alignment: "right",
        margin: [0, 0, 0, 15],
        fontSize: 10
      },
      {
        table: {
          headerRows: 1,
          widths: [80, 60, 50, 70, 100],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#E5E7EB",
          vLineColor: () => "#E5E7EB"
        }
      },
      {
        text: rtl(`إجمالي الأرصدة: ${formatCurrency(totalBalance)}`),
        alignment: "right",
        margin: [0, 15, 0, 5],
        fontSize: 12,
        bold: true
      },
      {
        text: rtl(`عدد الموردين: ${suppliers.length}`),
        alignment: "right",
        fontSize: 12
      }
    ] as Content[],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    },
    defaultStyle: {
      font: "Amiri",
      fontSize: 10
    }
  };

  createArabicPdf(docDefinition).download(`${filename}.pdf`);
}

export function exportTransactionsToPDF(
  transactions: Transaction[],
  suppliers: Supplier[],
  filename = "المعاملات"
) {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const tableBody: TableCell[][] = [
    headerRow(["الوصف", "المبلغ", "النوع", "المورد", "التاريخ"])
  ];

  transactions.forEach((t, index) => {
    tableBody.push(dataRow([
      t.description || "-",
      formatCurrency(t.amount),
      t.type === "debit" ? "مشتريات (له)" : "دفعة (منه)",
      supplierMap.get(t.supplierId) || "-",
      formatDate(t.date)
    ], index % 2 === 1));
  });

  const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: "landscape",
    pageSize: "A4",
    content: [
      {
        text: rtl("تقرير المعاملات"),
        style: "header",
        alignment: "center",
        margin: [0, 0, 0, 10]
      },
      {
        text: rtl(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`),
        alignment: "right",
        margin: [0, 0, 0, 15],
        fontSize: 10
      },
      {
        table: {
          headerRows: 1,
          widths: [100, 60, 60, 80, 60],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#E5E7EB",
          vLineColor: () => "#E5E7EB"
        }
      },
      {
        text: rtl(`إجمالي المشتريات: ${formatCurrency(totalDebits)}`),
        alignment: "right",
        margin: [0, 15, 0, 5],
        fontSize: 12,
        bold: true
      },
      {
        text: rtl(`إجمالي الدفعات: ${formatCurrency(totalCredits)}`),
        alignment: "right",
        margin: [0, 0, 0, 5],
        fontSize: 12,
        bold: true
      },
      {
        text: rtl(`عدد المعاملات: ${transactions.length}`),
        alignment: "right",
        fontSize: 12
      }
    ] as Content[],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    },
    defaultStyle: {
      font: "Amiri",
      fontSize: 10
    }
  };

  createArabicPdf(docDefinition).download(`${filename}.pdf`);
}

export function exportSupplierReportToPDF(
  supplier: Supplier,
  transactions: Transaction[],
  filename?: string
) {
  const content: Content[] = [
    {
      text: rtl(`كشف حساب: ${supplier.name}`),
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 10]
    },
    {
      text: rtl(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`),
      alignment: "right",
      margin: [0, 0, 0, 15],
      fontSize: 10
    },
    {
      columns: [
        { width: "*", text: "" },
        {
          width: "auto",
          table: {
            body: [
              [rtlCell(`الهاتف: ${supplier.phone || "-"}`, { border: [false, false, false, false] })],
              [rtlCell(`الفئة: ${supplier.category}`, { border: [false, false, false, false] })],
              [rtlCell(`الرصيد الحالي: ${formatCurrency(supplier.balance)}`, { border: [false, false, false, false], bold: true })]
            ]
          },
          layout: "noBorders"
        }
      ],
      margin: [0, 0, 0, 20]
    }
  ];

  if (transactions.length > 0) {
    const tableBody: TableCell[][] = [
      headerRow(["الوصف", "المبلغ", "النوع", "التاريخ"])
    ];

    transactions.forEach((t, index) => {
      tableBody.push(dataRow([
        t.description || "-",
        formatCurrency(t.amount),
        t.type === "debit" ? "له" : "منه",
        formatDate(t.date)
      ], index % 2 === 1));
    });

    content.push({
      table: {
        headerRows: 1,
        widths: [150, 80, 50, 80],
        body: tableBody
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#E5E7EB",
        vLineColor: () => "#E5E7EB"
      }
    });

    const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);

    content.push(
      {
        text: rtl(`إجمالي المشتريات: ${formatCurrency(totalDebits)}`),
        alignment: "right",
        margin: [0, 15, 0, 5],
        fontSize: 11,
        bold: true
      },
      {
        text: rtl(`إجمالي الدفعات: ${formatCurrency(totalCredits)}`),
        alignment: "right",
        fontSize: 11,
        bold: true
      }
    );
  } else {
    content.push({
      text: rtl("لا توجد معاملات لهذا المورد"),
      alignment: "center",
      margin: [0, 30, 0, 0],
      fontSize: 12,
      italics: true
    });
  }

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: "portrait",
    pageSize: "A4",
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    },
    defaultStyle: {
      font: "Amiri",
      fontSize: 10
    }
  };

  createArabicPdf(docDefinition).download(`${filename || `كشف_حساب_${supplier.name}`}.pdf`);
}
