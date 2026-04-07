# 운영용 에이전트 가이드

## 목적
터미널에서 자주 확인하는 운영 체크만 담는 빠른 참조 문서다.

## 문서 유형
보조 요약 문서입니다. 빠른 운영 체크만 담습니다.

## 역할
- 이 문서는 루트 `agent.md`의 축약본이 아니다.
- 브랜치, PR, 템플릿, 워크트리, UTF-8 같은 운영 체크만 담는다.
- 길게 읽지 않고 바로 확인할 때만 쓴다.

## 빠른 체크
- 현재 브랜치가 맞는지 확인한다.
- 작업 브랜치명은 규칙에 맞는지 확인한다.
- PR이나 이슈를 열 때 템플릿이 적용되는지 확인한다.
- UTF-8 콘솔 설정이 필요한지 확인한다.
- worktree가 남아 있으면 정리한다.
- GitHub Actions 체크 이름이 문서와 일치하는지 본다.

## 인코딩
```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
```

## 실패 모드
- 루트 규칙을 다시 길게 읽어야 하는 상태
- 운영 체크가 문서와 달라지는 상태
- 템플릿과 브랜치 규칙이 서로 어긋나는 상태
