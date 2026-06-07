# API Contract Notes

## Envelope
All responses must follow:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "optional"
}
```

## Auth Failure

```json
{
  "success": false,
  "data": null,
  "error": {"code": "UNAUTHENTICATED", "message": "로그인이 필요합니다."},
  "message": "로그인이 필요합니다."
}
```

## Priority Endpoint Groups
- `/api/v1/ai/*`
- `/api/v1/media/*`
- `/api/v1/shortform/*`
- `/api/v1/custom-courses/*`
