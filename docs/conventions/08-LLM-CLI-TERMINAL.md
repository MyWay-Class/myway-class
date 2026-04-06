# LLM CLI / 터미널 관리 규칙

## 목적
LLM CLI와 PowerShell 터미널을 작업에 맞게 관리한다.

## 규칙
- 터미널에서 필요한 명령만 실행한다.
- 한글이 깨지면 UTF-8 설정을 먼저 적용한다.
- 긴 명령은 짧게 나눠서 실행한다.
- 로그와 출력은 작업 검증에 필요한 만큼만 본다.

## UTF-8 설정
```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
```

## 사용 방식
- 문서 확인과 파일 점검은 읽기 명령으로 먼저 한다.
- 수정은 `apply_patch`를 우선한다.
- 빌드/테스트는 필요한 경우에만 실행한다.

## 금지
- 무의미한 반복 실행
- 터미널 출력만 보고 완료했다고 판단하는 것
- 인코딩 설정 없이 한글 문서를 다루는 것

## 검증 기준
- 터미널 출력이 깨지지 않는다.
- AI가 명령 결과를 해석하기 쉽다.
