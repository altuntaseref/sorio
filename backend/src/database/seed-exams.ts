import { DataSource } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { ExamSection } from '../exams/entities/exam-section.entity';
import { Subject } from '../subjects/entities/subject.entity';
import * as fs from 'fs';
import * as path from 'path';

interface IExamData {
  order: number;
  code: string;
  name: string;
  shortName: string;
  level: 'HIGH_SCHOOL' | 'UNIVERSITY' | 'PUBLIC_SECTOR' | 'ACADEMIC';
  incorrectToNullify: number;
  sections: Array<{
    key: string;
    name: string;
    questionCount: number;
  }>;
}

export async function seedExams(dataSource: DataSource) {
  const examRepository = dataSource.getRepository(Exam);
  const examSectionRepository = dataSource.getRepository(ExamSection);
  const subjectRepository = dataSource.getRepository(Subject);

  // Read exams data from JSON file
  const examsFilePath = path.join(__dirname, '../../../.data/dersler.json');
  const examsData: IExamData[] = JSON.parse(
    fs.readFileSync(examsFilePath, 'utf-8'),
  );

  console.log(`📚 ${examsData.length} sınav verisi bulundu.`);

  for (const examData of examsData) {
    // Check if exam already exists
    let exam = await examRepository.findOne({
      where: { code: examData.code },
    });

    if (!exam) {
      // Create exam
      exam = examRepository.create({
        code: examData.code,
        name: examData.name,
        shortName: examData.shortName,
        level: examData.level,
        incorrectToNullify: examData.incorrectToNullify,
        order: examData.order,
      });
      exam = await examRepository.save(exam);
      console.log(`✅ Sınav oluşturuldu: ${exam.name} (${exam.code})`);
    } else {
      // Update exam if needed
      exam.name = examData.name;
      exam.shortName = examData.shortName;
      exam.level = examData.level;
      exam.incorrectToNullify = examData.incorrectToNullify;
      exam.order = examData.order;
      exam = await examRepository.save(exam);
      console.log(`🔄 Sınav güncellendi: ${exam.name} (${exam.code})`);
    }

    // Process sections
    for (let i = 0; i < examData.sections.length; i++) {
      const sectionData = examData.sections[i];

      // Check if section already exists
      let section = await examSectionRepository.findOne({
        where: { examId: exam.id, key: sectionData.key },
      });

      if (!section) {
        // Create section
        section = examSectionRepository.create({
          examId: exam.id,
          key: sectionData.key,
          name: sectionData.name,
          questionCount: sectionData.questionCount,
          orderIndex: i,
        });
        section = await examSectionRepository.save(section);
        console.log(`  ✅ Bölüm oluşturuldu: ${section.name} (${section.key})`);
      } else {
        // Update section if needed
        section.name = sectionData.name;
        section.questionCount = sectionData.questionCount;
        section.orderIndex = i;
        section = await examSectionRepository.save(section);
        console.log(`  🔄 Bölüm güncellendi: ${section.name} (${section.key})`);
      }

      // Sync to subjects table (create system subject if not exists)
      const existingSubject = await subjectRepository.findOne({
        where: {
          examCode: exam.code,
          sectionKey: section.key,
          isSystem: true,
        },
      });

      if (!existingSubject) {
        const systemSubject = subjectRepository.create({
          name: section.name,
          examCode: exam.code,
          sectionKey: section.key,
          isSystem: true,
          userId: null,
          examTarget: null, // Deprecated, but keep for backward compatibility
        });
        await subjectRepository.save(systemSubject);
        console.log(
          `    ✅ Sistem dersi oluşturuldu: ${systemSubject.name} (${exam.code}/${section.key})`,
        );
      } else {
        // Update subject name if changed
        if (existingSubject.name !== section.name) {
          existingSubject.name = section.name;
          await subjectRepository.save(existingSubject);
          console.log(
            `    🔄 Sistem dersi güncellendi: ${existingSubject.name}`,
          );
        }
      }
    }
  }

  console.log('✅ Tüm sınavlar ve dersler başarıyla eklendi/güncellendi!');
}
