# 2026-04-13 멀티 강의 시드(dev)

## 변경 요약
- 경제, 영어, 자바, 파이썬, 자격증 강의를 dev D1에 미리 시드했다.
- 각 차시 영상은 remote R2 버킷 `myway-class-assets`에 업로드했다.
- 강의 영상 읽기 경로를 public GET으로 열어 `<video>` 재생이 가능하도록 정리했다.

## 시드 항목
- `crs_econ_seed_001` / `lec_econ_seed_001~003`
- `crs_eng_seed_001` / `lec_eng_seed_001`
- `crs_java_seed_001` / `lec_java_seed_001~003`
- `crs_python_seed_001` / `lec_python_seed_001~003`
- `crs_cert_seed_001` / `lec_cert_seed_001`

## 검증
- remote D1 execute 성공
- dev backend 재배포 성공
- `/api/v1/courses`에서 신규 5개 과정 확인
- `/api/v1/courses/crs_java_seed_001`에서 lecture `video_url` 확인
