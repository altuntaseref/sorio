import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { QuestionStatistic } from '../../statistics/entities/question-statistic.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'topic_id' })
  topicId: string;

  @Column({ name: 'question_image_url', nullable: true })
  questionImageUrl: string;

  @Column({ name: 'question_image_key', nullable: true })
  questionImageKey: string;

  @Column({ length: 1 })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  solutionNote: string;

  @Column({ name: 'solution_image_url', nullable: true })
  solutionImageUrl: string;

  @Column({ name: 'solution_image_key', nullable: true })
  solutionImageKey: string;

  @Column({ name: 'ai_solution', type: 'text', nullable: true })
  aiSolution: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.questions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Subject, (subject) => subject.questions)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => Topic, (topic) => topic.questions)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @OneToMany(() => QuestionStatistic, (stats) => stats.question)
  stats: QuestionStatistic[];
}
