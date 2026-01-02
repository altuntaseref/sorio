import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { QuestionStatistic } from '../../statistics/entities/question-statistic.entity';

@Entity('questions')
@Index(['subject', 'topic'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'uuid', name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string;

  @Column({ type: 'text', name: 'question_image_url' })
  questionImageUrl: string;

  @Column({ type: 'char', length: 1, name: 'correct_answer' })
  correctAnswer: string;

  @Column({ type: 'text', name: 'solution_note', nullable: true })
  solutionNote: string;

  @Column({ type: 'text', name: 'solution_image_url', nullable: true })
  solutionImageUrl: string;

  @Column({ type: 'text', name: 'ai_solution', nullable: true })
  aiSolution: string;

  @OneToMany(() => QuestionStatistic, (statistic) => statistic.question)
  stats: QuestionStatistic[];

  @Index()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
