import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from './Student';

@Entity('homeworks')
export class Homework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  student_id: string;

  @ManyToOne(() => Student, (student) => student.homeworks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'simple-json', default: '{}' })
  content: Record<string, any>;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  whiteboard_image_url?: string | null;

  @CreateDateColumn()
  created_at: Date;
}
