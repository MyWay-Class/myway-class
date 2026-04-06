# 커밋 규칙

## 목적
커밋 메시지와 커밋 단위를 일관되게 유지한다.

## 규칙
- 커밋 메시지는 영어로 쓴다.
- 메시지는 짧고 행동 중심이어야 한다.
- 한 커밋에는 하나의 의미 있는 변경만 담는다.
- 문서 수정과 코드 수정은 같은 목적일 때 함께 묶는다.
- 커밋 템플릿은 `/.gitmessage`를 사용하고, 로컬에서 `git config commit.template .gitmessage`로 연결할 수 있다.

## 권장 형식
- `feat: add moscow rules`
- `docs: update agent guide`
- `fix: align ai strategy`

## 금지
- 의미 없는 `update`, `misc`, `temp`
- 너무 큰 단일 커밋
- 목적이 섞인 커밋

## 검증 기준
- 커밋 목록만 봐도 작업 흐름이 보인다.
- 나중에 되돌릴 때 범위가 명확하다.
