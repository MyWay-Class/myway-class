# 운영용 에이전트 가이드

## 목적
짧은 작업 규칙만 담는 운영용 보조 문서다.

## 규칙
- 작업은 작은 단위로 나눈다.
- 관련 없는 문서는 건드리지 않는다.
- 파일 수정은 `apply_patch`를 우선한다.
- 문서와 코드가 실제로 일치해야 한다.
- 무료 API가 없어도 흐름은 유지한다.
- AI 출력은 검증 가능하고 추적 가능해야 한다.
- 문서는 짧게 유지하고, 길어지면 분리한다.

## 인코딩
```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
```

## 실행 순서
1. 작업 유형을 확인한다.
2. 관련 문서만 읽는다.
3. 필요한 범위만 수정한다.
4. 빌드나 테스트가 있으면 먼저 확인한다.
5. 변경 후 결과를 검증한다.
6. 문서가 바뀌면 함께 갱신한다.
