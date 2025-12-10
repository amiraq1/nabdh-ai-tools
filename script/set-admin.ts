// Script to set user role to admin by email
import "dotenv/config";
import { storage } from "../server/storage.js";

const email = process.argv[2];

if (!email) {
  console.error("❌ يرجى إدخال البريد الإلكتروني");
  console.log("الاستخدام: npm run set-admin <email>");
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${email}`);
    
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.error(`❌ المستخدم غير موجود: ${email}`);
      console.log("\n💡 تأكد من أن المستخدم قد سجل الدخول مرة واحدة على الأقل");
      process.exit(1);
    }
    
    console.log(`✅ تم العثور على المستخدم:`);
    console.log(`   - الاسم: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'غير محدد');
    console.log(`   - البريد: ${user.email}`);
    console.log(`   - الصلاحية الحالية: ${user.role}`);
    
    if (user.role === "admin") {
      console.log(`\n✅ المستخدم لديه صلاحيات admin بالفعل!`);
      process.exit(0);
    }
    
    console.log(`\n🔄 تحديث الصلاحيات إلى admin...`);
    const updatedUser = await storage.updateUserRole(user.id, "admin");
    
    if (!updatedUser) {
      console.error("❌ فشل تحديث الصلاحيات");
      process.exit(1);
    }
    
    console.log(`\n✅ تم تحديث الصلاحيات بنجاح!`);
    console.log(`   - البريد: ${updatedUser.email}`);
    console.log(`   - الصلاحية الجديدة: ${updatedUser.role}`);
    console.log(`\n🎉 المستخدم الآن لديه صلاحيات كاملة (admin)`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
    process.exit(1);
  }
}

setAdmin();

