// تحويل الأرقام إلى كلمات عربية
// ملف منفصل لتحسين الأداء - لا يحتاج مكتبات PDF/Excel الثقيلة

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
  const formattedNumber = new Intl.NumberFormat("en-US").format(amount);
  return {
    numeric: `${formattedNumber} د.ع`,
    words: numberToArabicWords(amount)
  };
}
