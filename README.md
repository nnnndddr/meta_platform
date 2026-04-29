# Meta Platform

Schema-driven платформа для управления сущностями произвольной структуры. Поддерживает создание схем сущностей, CRUD-операции над записями, real-time уведомления через WebSocket, групповой доступ и файловые вложения.

## Архитектура

```
┌─────────────────┐     HTTP /api/*      ┌──────────────────────┐
│   Frontend      │ ──────────────────▶  │  Main Backend :8000  │
│   React :5173   │                      │  FastAPI + PostgreSQL│
│                 │  ws://localhost:8001 │  + MinIO            │
│                 │ ◀──────────────────  └──────────┬───────────┘
└─────────────────┘                                 │ HTTP POST /internal/events
                      ┌─────────────────────────────▼───────────┐
                      │  Notification Service :8001             │
                      │  FastAPI · In-memory · WebSocket · Email│
                      └─────────────────────────────────────────┘
```

## Стек

| Слой | Технология |
|------|-----------|
| Main Backend | Python 3.12 · FastAPI · SQLAlchemy (async) · asyncpg |
| База данных | PostgreSQL 16 |
| Файловые вложения | MinIO (S3-совместимый) |
| Notification Service | FastAPI · WebSocket · SMTP |
| Frontend | React 18 · TypeScript · Ant Design · Zustand · React Query |
| Инфраструктура | Docker Compose · uv |

---

## Быстрый старт

### 1. Зависимости

- Docker Desktop
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) — `pip install uv`
- Node.js 18+ (только для фронтенда)

### 2. Инфраструктура (PostgreSQL + MinIO)

```bash
cp .env.example .env          # при необходимости измени пароли
docker compose up -d
```

Docker Compose читает переменные из `.env` автоматически.

| Сервис | Адрес |
|--------|-------|
| PostgreSQL | `localhost:5432` |
| MinIO API | `localhost:9000` |
| MinIO Console | `localhost:9001` |

### 3. Main Backend

```bash
cd meta-platform/backend
cp .env.example .env          # настройки БД и MinIO
uv sync                       # установка зависимостей
uv run alembic upgrade head   # применение миграций
uv run uvicorn app.main:app --port 8000 --reload
```

### 4. Notification Service

```bash
cd notifications
cp .env.example .env          # опционально — для SMTP
uv sync
uv run uvicorn main:app --port 8001 --reload
```

### 5. Frontend (опционально)

```bash
cd meta-platform/frontend
npm install
npm run dev                   # http://localhost:5173
```

---

## API Reference

Интерактивная документация после запуска бэкенда:

| | URL |
|-|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Notification Service Swagger** | http://localhost:8001/docs |

---

## Основной бэкенд

Base URL: `http://localhost:8000`

Запросы и ответы — `application/json`.
Для идентификации пользователя передаётся заголовок `X-User-ID` (см. [Demo-пользователи](#demo-пользователи)).

### Схемы сущностей `/api/meta`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/meta` | Список всех схем |
| `GET` | `/api/meta/{entity_id}` | Получение схемы |
| `POST` | `/api/meta/{entity_id}` | Создание / обновление схемы |
| `DELETE` | `/api/meta/{entity_id}` | Удаление схемы (каскадно удаляет записи) |

<details>
<summary>Пример схемы</summary>

```json
{
  "id": "task",
  "name": "Task",
  "description": "Development tasks",
  "layout": "kanban",
  "allow_attachments": true,
  "fields": [
    {
      "name": "title",
      "type": "text",
      "label": "Title",
      "required": true
    },
    {
      "name": "status",
      "type": "select",
      "label": "Status",
      "options": ["open", "in_progress", "done"],
      "x-ui": {
        "kanban_group": true,
        "color_map": { "done": "green", "in_progress": "blue" }
      }
    },
    {
      "name": "assignee",
      "type": "user",
      "label": "Assignee"
    }
  ],
  "actions": [],
  "version": 1
}
```

</details>

### Записи `/api/data`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/data/{entity_id}` | Список записей (фильтрация по группе пользователя) |
| `GET` | `/api/data/{entity_id}/{record_id}` | Получение записи |
| `POST` | `/api/data/{entity_id}` | Создание записи |
| `PATCH` | `/api/data/{entity_id}/{record_id}` | Частичное обновление записи |
| `DELETE` | `/api/data/{entity_id}/{record_id}` | Удаление записи |

<details>
<summary>Примеры запросов</summary>

**Создание записи**
```bash
curl -X POST http://localhost:8000/api/data/task \
  -H "Content-Type: application/json" \
  -H "X-User-ID: alice" \
  -d '{"data": {"title": "Fix login bug", "status": "open", "assignee": "alice"}}'
```

**Ответ**
```json
{
  "id": "3f7a1b2c-d4e5-6789-abcd-ef0123456789",
  "entity_id": "task",
  "data": { "title": "Fix login bug", "status": "open", "assignee": "alice" },
  "owner_group": "engineering",
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": "2026-04-29T10:00:00Z"
}
```

**Обновление статуса**
```bash
curl -X PATCH http://localhost:8000/api/data/task/3f7a1b2c-... \
  -H "Content-Type: application/json" \
  -H "X-User-ID: alice" \
  -d '{"data": {"status": "done"}}'
```

</details>

### Файловые вложения `/api/attachments`

Доступно только для сущностей с `"allow_attachments": true`.

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/attachments/{entity_id}/{record_id}` | Список файлов записи |
| `POST` | `/api/attachments/{entity_id}/{record_id}` | Загрузка файла (`multipart/form-data`, поле `file`) |
| `GET` | `/api/attachments/{entity_id}/{record_id}/{filename}/url` | Presigned URL для скачивания (действует 1 час) |
| `DELETE` | `/api/attachments/{entity_id}/{record_id}/{filename}` | Удаление файла |

<details>
<summary>Примеры запросов</summary>

**Загрузка файла**
```bash
curl -X POST http://localhost:8000/api/attachments/task/3f7a1b2c-... \
  -H "X-User-ID: alice" \
  -F "file=@/path/to/screenshot.png"
```

**Ответ**
```json
{ "name": "screenshot.png", "size": 204800, "content_type": "image/png" }
```

**Получение ссылки для скачивания**
```bash
curl http://localhost:8000/api/attachments/task/3f7a1b2c-.../screenshot.png/url
# → { "url": "http://localhost:9000/meta-attachments/task/.../screenshot.png?X-Amz-Signature=..." }
```

</details>

### Пользователи `/api/users`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/users` | Список demo-пользователей |

### Healthcheck

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Проверка доступности сервиса |

---

## Notification Service

Base URL: `http://localhost:8001`

### REST

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/notifications/{user_id}` | История уведомлений (последние 50) |
| `POST` | `/notifications/{user_id}/read-all` | Отметить все уведомления как прочитанные |
| `DELETE` | `/notifications/{user_id}/{notification_id}` | Удаление уведомления |
| `GET` | `/users` | Список пользователей |
| `GET` | `/health` | Проверка доступности сервиса |

### WebSocket

```
ws://localhost:8001/ws/{user_id}
```

Сервер отправляет JSON-сообщение при каждом новом событии.

**Формат уведомления:**
```json
{
  "id": "uuid",
  "user_id": "alice",
  "event_type": "record.created",
  "entity_id": "task",
  "entity_name": "Task",
  "record_id": "uuid",
  "record_title": "Fix login bug",
  "message": "New Task: \"Fix login bug\" was created",
  "created_at": "2026-04-29T10:00:00",
  "read": false
}
```

**Типы событий:** `record.created` · `record.updated` · `record.deleted`

**Keepalive:**
```json
→ { "action": "ping" }
← { "action": "pong" }
```

---

## Demo-пользователи

Авторизация не реализована. Идентификация выполняется через заголовок `X-User-ID`.

| X-User-ID | Имя | Группа | Роль |
|-----------|-----|--------|------|
| `alice` | Alice Johnson | engineering | member |
| `bob` | Bob Smith | engineering | **admin** |
| `carol` | Carol Williams | design | member |
| `dave` | Dave Brown | design | member |

### Групповой доступ

- Запись получает `owner_group` равный группе создателя
- Пользователь с ролью `member` видит только записи своей группы
- Пользователь с ролью `admin` видит все записи
- Уведомления доставляются участникам группы-владельца записи и всем пользователям с ролью `admin`

---


