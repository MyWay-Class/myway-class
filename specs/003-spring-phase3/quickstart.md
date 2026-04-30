# Quickstart

## 1) Build & Run

```powershell
cd backend-spring
mvn spring-boot:run
```

## 2) Verify Health

```powershell
curl http://127.0.0.1:8787/api/v1/health
```

## 3) Run Tests

```powershell
cd backend-spring
mvn test
```

## 4) Contract Test Focus

- ai/media/shortform/custom-courses endpoints return envelope format.
- unauthorized requests return `401` and `UNAUTHENTICATED`.

## 5) Retry Flow Manual Check

1. Create shortform export failure state.
2. Call retry endpoint.
3. Deliver callback with incremented event version.
4. Confirm terminal status behavior at retry limit.
