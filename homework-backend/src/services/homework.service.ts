import { AppDataSource } from '../config/data-source';
import { Homework } from '../entities/Homework';

export class HomeworkService {
  private homeworkRepository = AppDataSource.getRepository(Homework);

  async findAll(studentId?: string): Promise<Homework[]> {
    if (studentId) {
      return this.homeworkRepository.find({
        where: { student_id: studentId },
        relations: ['student'],
        order: { created_at: 'DESC' },
      });
    }
    return this.homeworkRepository.find({
      relations: ['student'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Homework | null> {
    return this.homeworkRepository.findOne({
      where: { id },
      relations: ['student'],
    });
  }

  async create(homeworkData: Partial<Homework>): Promise<Homework> {
    const homework = this.homeworkRepository.create(homeworkData);
    return this.homeworkRepository.save(homework);
  }

  async update(id: string, updateData: Partial<Homework>): Promise<Homework | null> {
    const homework = await this.findById(id);
    if (!homework) {
      return null;
    }
    Object.assign(homework, updateData);
    return this.homeworkRepository.save(homework);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.homeworkRepository.delete(id);
    return !!(result.affected && result.affected > 0);
  }
}
