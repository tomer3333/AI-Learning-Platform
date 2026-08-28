import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Student } from '../entities/Student';

const mockStudents: Array<Partial<Student>> = [
  {
    name: 'דניאל כהן (Daniel Cohen)',
    syllabus_stage_index: 3,
    script_preference: 'hebrew_transliteration',
    general_notes: 'מתחיל — שלב אותיות, תנועות וברכות ראשונות. מעדיף תעתיק עברי עם ניקוד מדויק.',
  },
  {
    name: 'נועה לוי (Noa Levi)',
    syllabus_stage_index: 7,
    script_preference: 'hebrew_transliteration',
    general_notes: 'לומדת כינויי גוף ושייכות. דגש על אוצר מילים של בית ומשפחה.',
  },
  {
    name: 'יוסי אברהם (Yossi Avraham)',
    syllabus_stage_index: 12,
    script_preference: 'hebrew_transliteration',
    general_notes: 'מתקדם במיליות ענד/פיה/בדי ושלילה (מש/מא/לא).',
  },
  {
    name: 'מאיה ברק (Maya Barak)',
    syllabus_stage_index: 19,
    script_preference: 'arabic_letters',
    general_notes: 'שלב מערכת הפועל עבר בניין 1. לומדת וקוראת בכתב ערבי.',
  },
  {
    name: 'איתי שפירא (Itay Shapira)',
    syllabus_stage_index: 23,
    script_preference: 'arabic_letters',
    general_notes: 'הטיית הפועל בעתיד ובינוני פועל/פעול. שליטה מלאה באותיות ערביות.',
  },
  {
    name: 'רוני גולדשטיין (Roni Goldstein)',
    syllabus_stage_index: 28,
    script_preference: 'arabic_letters',
    general_notes: 'שלב בניין 2 ו-3, אוצר מילים רחב לשיחות מתקדמות.',
  },
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected.');

    const studentRepo = AppDataSource.getRepository(Student);

    console.log('\nInserting sample students...');
    for (const studentData of mockStudents) {
      const student = studentRepo.create(studentData);
      const saved = await studentRepo.save(student);
      console.log(`✨ Created: [${saved.id}] ${saved.name} | Stage: ${saved.syllabus_stage_index} | Script: ${saved.script_preference}`);
    }

    console.log('\n🎉 Successfully seeded students into database!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seed();
