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
  return 'dashboard';
}

export function pageTitle(page: LmsPageId, role: UserRole): string {
  const titles: Record<LmsPageId, string> = {
    dashboard: '대시보드',
    courses: '강의 상세',
    'lecture-watch': '영상 시청',
    'my-courses': '내 강의',
    'course-create': '강좌개설',
    'lecture-studio': '강의 제작',
    shortform: '숏폼',
    community: '숏폼',
    'my-shortforms': '숏폼',
    'ai-chat': 'AI 학습 챗',
    'media-pipeline': '실제 강의 업로드',
    'quiz-gen': '퀴즈 생성',
    'ai-summary': 'AI 요약',
    'assignment-check': '과제 검사',
    'admin-users': '사용자 관리',
    'admin-instructors': '강사 관리',
    'admin-assign': '강사·수강생 배정',
    'admin-stats': '통계 현황',
    'admin-automation': '업무 자동화',
  };

  if (page === 'dashboard' && role === 'INSTRUCTOR') {
    return '대시보드';
  }

  return titles[page];
}

export function navGroupsForRole(role: UserRole): LmsNavGroup[] {
  const groups: LmsNavGroup[] = [
    {
      label: '핵심',
      items: [
        { page: 'dashboard', icon: 'ri-dashboard-3-line', label: '대시보드' },
        { page: 'my-courses', icon: 'ri-book-open-line', label: '내 강의', aliases: ['courses', 'lecture-watch'] },
      ],
    },
  ];

  if (role === 'STUDENT') {
    groups.push({
      label: '학습 도구',
      items: [
        { page: 'shortform', icon: 'ri-scissors-cut-line', label: '숏폼', aliases: ['shortform-wizard', 'community', 'my-shortforms'] },
        { page: 'ai-chat', icon: 'ri-robot-line', label: 'AI 학습 챗' },
      ],
    });
  }

  if (role === 'INSTRUCTOR') {
    groups.push(
        {
          label: '제작 도구',
          items: [
          { page: 'my-courses', icon: 'ri-folder-user-line', label: '내 강의', badge: 'NEW', aliases: ['courses', 'lecture-watch'] },
          { page: 'course-create', icon: 'ri-add-circle-line', label: '강좌개설', badge: 'NEW' },
          { page: 'lecture-studio', icon: 'ri-layout-masonry-line', label: '강의 제작', badge: 'NEW' },
          { page: 'shortform', icon: 'ri-scissors-cut-line', label: '숏폼', aliases: ['community', 'my-shortforms'] },
          { page: 'ai-chat', icon: 'ri-robot-line', label: 'AI 챗' },
        ],
      },
      {
        label: '학습 도구',
        items: [
          { page: 'quiz-gen', icon: 'ri-question-line', label: '퀴즈 생성' },
          { page: 'ai-summary', icon: 'ri-file-text-line', label: 'AI 요약' },
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
          { page: 'my-courses', icon: 'ri-folder-user-line', label: '내 강의', aliases: ['courses', 'lecture-watch'] },
          { page: 'admin-users', icon: 'ri-user-settings-line', label: '사용자 관리', aliases: ['admin-user-detail'] },
        ],
      },
      {
        label: '강의 관리',
        items: [
          { page: 'course-create', icon: 'ri-add-circle-line', label: '강좌개설' },
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
