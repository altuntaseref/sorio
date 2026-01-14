import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserExamTarget } from './entities/user-exam-target.entity';
import { ExamTargetGoal } from './entities/exam-target-goal.entity';
import { MockExam } from './entities/mock-exam.entity';
import { MockExamSubjectResult } from './entities/mock-exam-subject-result.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Exam } from '../exams/entities/exam.entity';
import { SetExamTargetsDto } from './dto/set-exam-targets.dto';
import { SetExamGoalDto } from './dto/set-exam-goal.dto';
import { CreateMockExamDto } from './dto/create-mock-exam.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MockExamsService {
  constructor(
    @InjectRepository(UserExamTarget)
    private readonly userExamTargetRepository: Repository<UserExamTarget>,
    @InjectRepository(ExamTargetGoal)
    private readonly examTargetGoalRepository: Repository<ExamTargetGoal>,
    @InjectRepository(MockExam)
    private readonly mockExamRepository: Repository<MockExam>,
    @InjectRepository(MockExamSubjectResult)
    private readonly mockExamSubjectResultRepository: Repository<MockExamSubjectResult>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  // Kullanıcının sınav hedeflerini ayarla
  async setExamTargets(
    userId: string,
    dto: SetExamTargetsDto,
  ): Promise<UserExamTarget[]> {
    // Önce mevcut hedefleri sil
    await this.userExamTargetRepository.delete({ userId });

    // Yeni hedefleri ekle
    const targets = dto.examCodes.map((examCode) =>
      this.userExamTargetRepository.create({ userId, examCode }),
    );

    return this.userExamTargetRepository.save(targets);
  }

  // Kullanıcının sınav hedeflerini getir
  async getExamTargets(userId: string): Promise<UserExamTarget[]> {
    return this.userExamTargetRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  // Hedef net belirle/güncelle
  async setExamGoal(
    userId: string,
    dto: SetExamGoalDto,
  ): Promise<ExamTargetGoal> {
    let goal = await this.examTargetGoalRepository.findOne({
      where: { userId, examCode: dto.examCode },
    });

    if (goal) {
      goal.targetNet = dto.targetNet;
      return this.examTargetGoalRepository.save(goal);
    }

    goal = this.examTargetGoalRepository.create({
      userId,
      examCode: dto.examCode,
      targetNet: dto.targetNet,
    });

    return this.examTargetGoalRepository.save(goal);
  }

  // Hedef netleri getir
  async getExamGoals(userId: string): Promise<ExamTargetGoal[]> {
    return this.examTargetGoalRepository.find({
      where: { userId },
    });
  }

  // Sınavın derslerini getir (sistem dersleri)
  async getSubjectsByExamCode(examCode: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { examCode, isSystem: true },
      relations: ['topics'],
      order: { name: 'ASC', topics: { createdAt: 'ASC' } },
    });
  }

  // Deneme sınavı kaydet
  async createMockExam(
    userId: string,
    dto: CreateMockExamDto,
  ): Promise<MockExam> {
    // Exam'in var olduğunu kontrol et
    const exam = await this.examRepository.findOne({
      where: { code: dto.examCode },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with code ${dto.examCode} not found`);
    }

    // Net hesaplama fonksiyonu
    const calculateNet = (correct: number, wrong: number): number => {
      return Number((correct - wrong / exam.incorrectToNullify).toFixed(2));
    };

    // Subject result'ları oluştur ve net hesapla
    const subjectResults: MockExamSubjectResult[] = [];
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;

    for (const resultDto of dto.subjectResults) {
      // Subject'in var olduğunu kontrol et
      const subject = await this.subjectRepository.findOne({
        where: { id: resultDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException(
          `Subject with id ${resultDto.subjectId} not found`,
        );
      }

      const net = calculateNet(resultDto.correct, resultDto.wrong);

      subjectResults.push(
        this.mockExamSubjectResultRepository.create({
          subjectId: resultDto.subjectId,
          correctCount: resultDto.correct,
          wrongCount: resultDto.wrong,
          emptyCount: resultDto.empty,
          net,
        }),
      );

      totalCorrect += resultDto.correct;
      totalWrong += resultDto.wrong;
      totalEmpty += resultDto.empty;
    }

    const totalNet = calculateNet(totalCorrect, totalWrong);

    // Aynı sınav tipindeki en yüksek net'i kontrol et (rekor mu?)
    const highestNet = await this.mockExamRepository
      .createQueryBuilder('mock_exam')
      .where('mock_exam.user_id = :userId', { userId })
      .andWhere('mock_exam.exam_code = :examCode', { examCode: dto.examCode })
      .select('MAX(mock_exam.total_net)', 'maxNet')
      .getRawOne();

    const isRecord =
      !highestNet?.maxNet || totalNet > Number(highestNet.maxNet);

    // Mock exam oluştur
    const mockExam = this.mockExamRepository.create({
      userId,
      examCode: dto.examCode,
      examName: dto.examName,
      examDate: new Date(dto.examDate),
      totalCorrect,
      totalWrong,
      totalEmpty,
      totalNet,
      isRecord,
      subjectResults,
    });

    return this.mockExamRepository.save(mockExam);
  }

  // Deneme sınavlarını listele
  async getMockExams(
    userId: string,
    examCode?: string,
  ): Promise<MockExam[]> {
    const where: any = { userId };
    if (examCode) {
      where.examCode = examCode;
    }

    return this.mockExamRepository.find({
      where,
      relations: ['subjectResults', 'subjectResults.subject'],
      order: { examDate: 'DESC' },
    });
  }

  // Deneme sınavı detayı
  async getMockExamById(
    userId: string,
    id: string,
  ): Promise<any> {
    const mockExam = await this.mockExamRepository.findOne({
      where: { id, userId },
      relations: ['subjectResults', 'subjectResults.subject'],
    });

    if (!mockExam) {
      throw new NotFoundException(`Mock exam with id ${id} not found`);
    }

    // Zayıf nokta analizi ekle
    const weakPointAnalysis = this.calculateWeakPointAnalysis(mockExam);

    return {
      ...mockExam,
      weakPointAnalysis,
    };
  }

  // Zayıf nokta analizi hesapla
  private calculateWeakPointAnalysis(mockExam: MockExam): any {
    if (!mockExam.subjectResults || mockExam.subjectResults.length === 0) {
      return null;
    }

    // Ortalama net hesapla
    const totalNet = mockExam.subjectResults.reduce(
      (sum, result) => sum + Number(result.net),
      0,
    );
    const averageNet = totalNet / mockExam.subjectResults.length;

    // Ortalamanın altında kalan dersleri bul
    const weakSubjects = mockExam.subjectResults
      .filter((result) => Number(result.net) < averageNet)
      .map((result) => ({
        subjectId: result.subjectId,
        subjectName: result.subject?.name || 'Bilinmeyen Ders',
        net: Number(result.net),
        averageNet: Number(averageNet.toFixed(2)),
        difference: Number((averageNet - Number(result.net)).toFixed(2)),
      }))
      .sort((a, b) => a.net - b.net); // En düşük netten başla

    // En zayıf ders
    const weakestSubject = weakSubjects.length > 0 ? weakSubjects[0] : null;

    return {
      averageNet: Number(averageNet.toFixed(2)),
      weakSubjects,
      weakestSubject,
      hasWeakPoint: weakSubjects.length > 0,
    };
  }

  // Gelişim grafiği için veri
  async getProgress(
    userId: string,
    examCode: string,
  ): Promise<any> {
    // Hedef net
    const goal = await this.examTargetGoalRepository.findOne({
      where: { userId, examCode },
    });

    // Son deneme sınavı
    const lastExam = await this.mockExamRepository.findOne({
      where: { userId, examCode },
      order: { examDate: 'DESC' },
    });

    // Tüm deneme sınavları (trend için)
    const allExams = await this.mockExamRepository.find({
      where: { userId, examCode },
      order: { examDate: 'ASC' },
      select: ['id', 'examDate', 'totalNet', 'examName'],
    });

    const targetNet = goal?.targetNet || 0;
    const currentNet = lastExam?.totalNet || 0;
    const progress =
      targetNet > 0 ? Number(((currentNet / targetNet) * 100).toFixed(2)) : 0;

    return {
      currentNet,
      targetNet,
      progress,
      remainingNet: targetNet > 0 ? Number((targetNet - currentNet).toFixed(2)) : 0,
      lastPerformance: lastExam
        ? {
            examName: lastExam.examName,
            examDate: lastExam.examDate,
            totalNet: lastExam.totalNet,
            totalCorrect: lastExam.totalCorrect,
            totalWrong: lastExam.totalWrong,
            totalEmpty: lastExam.totalEmpty,
          }
        : null,
      trend: allExams.map((exam) => ({
        date: exam.examDate,
        net: exam.totalNet,
        examName: exam.examName,
      })),
    };
  }
}
