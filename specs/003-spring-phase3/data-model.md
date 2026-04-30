# Data Model

## Entities

### AiRuntimeSetting
- key: string (PK)
- value: string/json
- updated_at: timestamp

### MediaJob
- id: string (PK)
- lecture_id: string
- status: enum(PENDING, PROCESSING, COMPLETED, FAILED)
- retry_count: int
- last_error: string?
- version: long
- updated_at: timestamp

### TranscriptDocument
- id: string (PK)
- lecture_id: string (unique)
- segments_json: json text
- source: string
- updated_at: timestamp

### ShortformExportJob
- id: string (PK)
- shortform_id: string
- status: enum(PENDING, PROCESSING, COMPLETED, FAILED, FAILED_PERMANENT)
- retry_count: int
- last_event_version: long
- result_url: string?
- error_message: string?
- updated_at: timestamp

### CustomCourseRecord
- id: string (PK)
- owner_id: string
- course_id: string
- title: string
- description: string
- clips_json: json text
- visibility: string
- updated_at: timestamp
