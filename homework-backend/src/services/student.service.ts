import { AppDataSource } from '../config/data-source';
import { Student } from '../entities/Student';

export class StudentService {
  private studentRepository = AppDataSource.getRepository(Student);

  async findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      relations: ['homeworks'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { id },
      relations: ['homeworks'],
      order: { homeworks: { created_at: 'DESC' } },
    });
  }

  async create(studentData: Partial<Student>): Promise<Student> {
    const student = this.studentRepository.create(studentData);
    return this.studentRepository.save(student);
  }

  async update(id: string, updateData: Partial<Student>): Promise<Student | null> {
    const student = await this.findById(id);
    if (!student) {
      return null;
    }
    Object.assign(student, updateData);
    return this.studentRepository.save(student);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.studentRepository.delete(id);
    return !!(result.affected && result.affected > 0);
  }
}
