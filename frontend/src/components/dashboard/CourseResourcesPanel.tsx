import { useState } from 'react';
import type { CourseDetail, LoginResponse } from '@myway/shared';
import { formatDifficulty } from '../../lib/format';

export type MaterialInput = {
  title: string;
  summary: string;
  file_name: string;
};

export type NoticeInput = {
  title: string;
  content: string;
  pinned: boolean;
};

type CourseResourcesPanelProps = {
  busy: boolean;
  session: LoginResponse | null;
  selectedCourse: CourseDetail | null;
  canManageCurrent: boolean;
  onAddMaterial: (input: MaterialInput) => Promise<boolean>;
  onAddNotice: (input: NoticeInput) => Promise<boolean>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

export function CourseResourcesPanel({
  busy,
  session,
  selectedCourse,
  canManageCurrent,
  onAddMaterial,
  onAddNotice,
}: CourseResourcesPanelProps) {
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialSummary, setMaterialSummary] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);

  if (!selectedCourse) {
    return (
      <section className="panel panel--resources">
        <div className="panel__header">
          <div>
            <p className="section-label">자료와 공지</p>
            <h2>강의를 선택하면 자료와 공지가 보입니다</h2>
          </div>
        </div>
        <p className="empty-state">강의별 보조 자료와 운영 공지는 선택한 코스 기준으로 관리됩니다.</p>
      </section>
    );
  }

  const resetMaterialForm = (): void => {
    setMaterialTitle('');
    setMaterialSummary('');
    setMaterialFileName('');
  };

  const resetNoticeForm = (): void => {
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePinned(false);
  };

  return (
    <section className="panel panel--resources">
      <div className="panel__header">
        <div>
          <p className="section-label">자료와 공지</p>
          <h2>
            {selectedCourse.title} · 자료 {selectedCourse.materials.length}개 / 공지 {selectedCourse.notices.length}개
          </h2>
        </div>
      </div>

      <div className="resources-grid">
        <div className="resource-column">
          <div className="resource-column__header">
            <div>
              <p className="section-label">강의 자료</p>
              <h3>{formatDifficulty(selectedCourse.difficulty)} 코스 자료</h3>
            </div>
          </div>

          <div className="resource-list">
            {selectedCourse.materials.map((material) => (
              <article key={material.id} className="resource-card">
                <div className="resource-card__head">
                  <strong>{material.title}</strong>
                  <span>{formatDate(material.uploaded_at)}</span>
                </div>
                <p>{material.summary}</p>
                <small>{material.file_name}</small>
              </article>
            ))}
          </div>

          {canManageCurrent ? (
            <form
              className="resource-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!materialTitle.trim() || !materialSummary.trim() || !materialFileName.trim()) {
                  return;
                }
                const saved = await onAddMaterial({
                  title: materialTitle.trim(),
                  summary: materialSummary.trim(),
                  file_name: materialFileName.trim(),
                });
                if (saved) {
                  resetMaterialForm();
                }
              }}
            >
              <strong>자료 등록</strong>
              <label>
                제목
                <input value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} />
              </label>
              <label>
                요약
                <textarea value={materialSummary} onChange={(event) => setMaterialSummary(event.target.value)} />
              </label>
              <label>
                파일명
                <input value={materialFileName} onChange={(event) => setMaterialFileName(event.target.value)} />
              </label>
              <button disabled={busy || !session} type="submit">
                자료 등록
              </button>
            </form>
          ) : (
            <p className="empty-state">강사와 운영자만 자료를 등록할 수 있습니다.</p>
          )}
        </div>

        <div className="resource-column">
          <div className="resource-column__header">
            <div>
              <p className="section-label">공지</p>
              <h3>운영 공지와 안내</h3>
            </div>
          </div>

          <div className="resource-list">
            {selectedCourse.notices.map((notice) => (
              <article key={notice.id} className={`resource-card resource-card--notice ${notice.pinned ? 'is-pinned' : ''}`}>
                <div className="resource-card__head">
                  <strong>{notice.title}</strong>
                  <span>{formatDate(notice.created_at)}</span>
                </div>
                <p>{notice.content}</p>
                <small>{notice.pinned ? '고정 공지' : '일반 공지'}</small>
              </article>
            ))}
          </div>

          {canManageCurrent ? (
            <form
              className="resource-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!noticeTitle.trim() || !noticeContent.trim()) {
                  return;
                }
                const saved = await onAddNotice({
                  title: noticeTitle.trim(),
                  content: noticeContent.trim(),
                  pinned: noticePinned,
                });
                if (saved) {
                  resetNoticeForm();
                }
              }}
            >
              <strong>공지 등록</strong>
              <label>
                제목
                <input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} />
              </label>
              <label>
                내용
                <textarea value={noticeContent} onChange={(event) => setNoticeContent(event.target.value)} />
              </label>
              <label className="resource-form__checkbox">
                <input checked={noticePinned} onChange={(event) => setNoticePinned(event.target.checked)} type="checkbox" />
                고정 공지
              </label>
              <button disabled={busy || !session} type="submit">
                공지 등록
              </button>
            </form>
          ) : (
            <p className="empty-state">강사와 운영자만 공지를 등록할 수 있습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}
