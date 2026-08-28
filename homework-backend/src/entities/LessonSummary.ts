import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './Student';

@Entity('lesson_summaries')
export class LessonSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  date: Date;

  /**
   * Array of topic IDs (from syllabus.ts) covered in this lesson.
   * Stored as a JSON array in SQLite via simple-json.
   */
  @Column({ type: 'simple-json' })
  topicsCovered: string[];

  @Column({ type: 'text', nullable: true })
  teacherNote: string | null;

  @Column({ type: 'varchar' })
  student_id: string;

  @ManyToOne(() => Student, (student) => student.lessonSummaries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
