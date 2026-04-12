import type { AuthUser, LoginResponse, UserRole } from '@myway/shared';
import type { LmsNavGroup, LmsNavKey, LmsPageId } from './types';

export function roleLabel(role: UserRole): string {
  if (role === 'ADMIN') return '운영자';
  if (role === 'INSTRUCTOR') return '교강사';
  return '수강생';
}

export function userDescription(role: AuthUser['role']): string {
  if (role === 'ADMIN') return '수강생·강의·강사를 총괄하는 교육 운영 담당자';
  if (role === 'INSTRUCTOR') return 'AI 자동 채점과 콘텐츠 재구성을 활용하는 강사';
  return '숏폼 강의와 AI 검색으로 복습 효율을 높이는 학습자';
}

export function defaultPageForRole(session: LoginResponse | null): LmsPageId {
  if (!session) return 'dashboard';
  if (session.user.role === 'ADMIN') return 'admin-automation';
  if (session.user.role === 'INSTRUCTOR') return 'lecture-studio';
  return 'dashboard';
}

export function pageTitle(page: LmsPageId, role: UserRole): string {
  const titles: Record<LmsPageId, string> = {
    dashboard: '대시보드',
    courses: '강의 목록',
    'course-create': '강의 개설',
    'lecture-studio': '강의 제작 스튜디오',
    shortform: '숏폼 제작',
    community: '숏폼 커뮤니티',
    'my-shortforms': '내 숏폼',
    'ai-chat': 'AI 학습 챗',
    'media-pipeline': '미디어 파이프라인',
    'quiz-gen': '시험·퀴즈 자동 생성',
    'ai-summary': 'AI 강의 요약',
    'assignment-check': '과제 검사',
    'admin-users': '사용자 관리',
    'admin-instructors': '강사 관리',
    'admin-assign': '강사·수강생 배정',
    'admin-stats': '통계 현황',
    'admin-automation': '업무 자동화',
  };

  if (page === 'dashboard' && role === 'INSTRUCTOR') {
    return '강의 대시보드';
  }

  return titles[page];
}

export function navGroupsForRole(role: UserRole): LmsNavGroup[] {
  const groups: LmsNavGroup[] = [
    {
      label: '주요 메뉴',
      items: [
        { page: 'dashboard', icon: 'ri-dashboard-line', label: '대시보드' },
        { page: 'courses', icon: 'ri-book-2-line', label: '강의 목록', aliases: ['lecture-watch'] },
      ],
    },
  ];

  if (role === 'STUDENT') {
    groups.push({
      label: '학습 도구',
      items: [
        { page: 'shortform', icon: 'ri-scissors-cut-line', label: '숏폼 제작', aliases: ['shortform-wizard'] },
        { page: 'community', icon: 'ri-group-line', label: '숏폼 커뮤니티' },
        { page: 'my-shortforms', icon: 'ri-folder-video-line', label: '내 숏폼' },
        { page: 'ai-chat', icon: 'ri-robot-line', label: 'AI 학습 챗' },
      ],
    });
  }

  if (role === 'INSTRUCTOR') {
    groups.push(
      {
        label: '제작 도구',
        items: [
          { page: 'course-create', icon: 'ri-add-circle-line', label: '강의 개설', badge: 'NEW' },
          { page: 'lecture-studio', icon: 'ri-layout-masonry-line', label: '강의 제작 스튜디오', badge: 'NEW' },
          { page: 'media-pipeline', icon: 'ri-movie-2-line', label: '미디어 파이프라인' },
          { page: 'shortform', icon: 'ri-scissors-cut-line', label: '숏폼 제작' },
          { page: 'community', icon: 'ri-group-line', label: '숏폼 커뮤니티' },
          { page: 'ai-chat', icon: 'ri-robot-line', label: 'AI 챗' },
        ],
      },
      {
        label: '학습 도구',
        items: [
          { page: 'quiz-gen', icon: 'ri-question-line', label: '시험·퀴즈 자동 생성' },
          { page: 'ai-summary', icon: 'ri-file-text-line', label: 'AI 강의 요약' },
          { page: 'assignment-check', icon: 'ri-file-check-line', label: '과제 검사' },
        ],
      },
    );
  }

  if (role === 'ADMIN') {
    groups.push(
      {
        label: '운영 관리',
        items: [
          { page: 'admin-users', icon: 'ri-user-settings-line', label: '사용자 관리', aliases: ['admin-user-detail'] },
          { page: 'media-pipeline', icon: 'ri-movie-2-line', label: '미디어 파이프라인' },
        ],
      },
      {
        label: '강의 관리',
        items: [
          { page: 'course-create', icon: 'ri-add-circle-line', label: '강의 개설' },
          { page: 'admin-instructors', icon: 'ri-user-star-line', label: '강사 관리' },
          { page: 'admin-assign', icon: 'ri-links-line', label: '강사·수강생 배정' },
          { page: 'admin-stats', icon: 'ri-bar-chart-box-line', label: '통계 현황' },
          { page: 'admin-automation', icon: 'ri-flashlight-line', label: '업무 자동화' },
        ],
      },
    );
  }

  return groups;
}

export function isNavItemActive(item: LmsNavGroup['items'][number], activeNavKey: LmsNavKey): boolean {
  return item.page === activeNavKey || item.aliases?.includes(activeNavKey) === true;
}
