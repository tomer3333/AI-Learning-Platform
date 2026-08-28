import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Student } from '../entities/Student';
import { Homework } from '../entities/Homework';
import { LessonSummary } from '../entities/LessonSummary';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true,
  logging: process.env.DB_LOGGING === 'true',
  entities: [Student, Homework, LessonSummary],
  migrations: [],
  subscribers: [],
});
