import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Homework } from './Homework';
import { LessonSummary } from './LessonSummary';

export type ScriptPreference = 'hebrew_transliteration' | 'arabic_letters';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  syllabus_stage_index: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'hebrew_transliteration',
  })
  script_preference: ScriptPreference;

  @Column({ type: 'text', nullable: true })
  general_notes?: string | null;

  @Column({ type: 'boolean', default: false })
  payment_paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Homework, (homework) => homework.student)
  homeworks: Homework[];

  @OneToMany(() => LessonSummary, (lessonSummary) => lessonSummary.student)
  lessonSummaries: LessonSummary[];
}
