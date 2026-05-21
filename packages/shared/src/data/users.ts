import type { AuthUser } from '../types';

export const demoUsers: AuthUser[] = [
  {
    id: 'usr_std_001',
    name: '데모 수강생',
    email: 'student@mywayclass.local',
    role: 'STUDENT',
    department: '학습자',
    bio: '강의 숏폼과 커스텀 강의를 활용해 복습 효율을 높이고 싶은 수강생입니다.',
  },
  {
    id: 'usr_inst_001',
    name: '김민준',
    email: 'instructor1@mywayclass.local',
    role: 'INSTRUCTOR',
    department: 'AI 교육학부',
    bio: '학습 데이터를 기반으로 더 나은 강의를 설계하는 강사입니다.',
  },
  {
    id: 'usr_admin_001',
    name: '오운영',
    email: 'admin@mywayclass.local',
    role: 'ADMIN',
    department: '교육 운영팀',
    bio: '수강 흐름과 운영 데이터를 관리하는 운영자입니다.',
  },
];

export function getDemoUser(userId: string): AuthUser | undefined {
  return demoUsers.find((user) => user.id === userId);
}

export const instructorNames: Record<string, string> = {
  usr_inst_001: '김민준',
  usr_inst_002: '이서연',
};
