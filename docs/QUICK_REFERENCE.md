# ⚡ QUICK REFERENCE — Краткая справка

## 1️⃣ ВЫБРАННЫЙ СТЕК

```
Frontend:    Next.js 14+ | React 18+ | TailwindCSS | Shadcn/ui
Backend:     Node.js | Prisma ORM | PostgreSQL
Interactive: Recharts (графики) | React Flow (алгоритмы) | Mermaid.js
PDF:         jsPDF
Security:    AES-256 (шифрование) | bcrypt (пароли)
i18n:        next-intl (RU/KK/EN)
State:       Zustand | React Query
Testing:     Jest | Playwright
Deployment:  Vercel (frontend) | Railway (backend + DB)
```

**Стоимость:** $50-100/мес (Railway + Vercel Pro)

---

## 2️⃣ СТРУКТУРА ПРОЕКТА (в 30 секунд)

```
urowomen/
├── app/
│   ├── tools/iciq-sf/        ← Опросник
│   ├── tools/algorithms/     ← Диагностика
│   └── api/
│       ├── questionnaire/    ← API для опросника
│       └── export/pdf        ← PDF генерация
├── components/
│   ├── ICIQSFQuestionnaire.tsx
│   ├── DiagnosticAlgorithmMermaid.tsx
│   └── ui/                   ← Shadcn компоненты
├── lib/
│   ├── utils/
│   │   ├── scoring.ts        ← Расчет баллов
│   │   ├── encryption.ts     ← Шифрование
│   │   └── pdfGenerator.ts
│   ├── store/
│   │   └── questionnaireStore.ts  ← Zustand
│   └── types/
├── prisma/
│   └── schema.prisma         ← БД схема
└── .env.local               ← Переменные
```

---

## 3️⃣ БЫСТРЫЙ СТАРТ (10 КОМАНД)

```bash
# 1. Создать Next.js проект
npx create-next-app@latest urowomen --typescript --tailwind

cd urowomen

# 2. Установить зависимости
npm install react-flow-renderer mermaid jspdf recharts zustand @tanstack/react-query prisma @prisma/client next-intl

# 3. Инициализировать Prisma
npx prisma init

# 4. Настроить .env.local
# DATABASE_URL="postgresql://user:password@localhost:5432/urowomen"
# ENCRYPTION_KEY="your-32-character-key-here"

# 5. Скопировать schema.prisma из DATABASE_SCHEMA_GDPR.md

# 6. Создать миграции
npx prisma migrate dev --name init

# 7. Скопировать компоненты в components/

# 8. Создать страницы:
# app/tools/iciq-sf/page.tsx
# app/tools/algorithms/page.tsx

# 9. Запустить dev сервер
npm run dev

# 10. Открыть http://localhost:3000
```

**Время:** 30 минут до первого рабочего приложения

---

## 4️⃣ ГЛАВНЫЕ КОМПОНЕНТЫ

### A. ICIQ-SF Опросник

```typescript
// Использование
import ICIQSFQuestionnaire from '@/components/ICIQSFQuestionnaire';

export default function Page() {
  return <ICIQSFQuestionnaire />;
}

// Результат: 3 вопроса → расчет 0-21 балла → PDF
// Features:
// - ✅ Валидация
// - ✅ Автоматический расчет
// - ✅ PDF экспорт
// - ✅ LocalStorage сохранение
// - ✅ WCAG AAA
```

### B. Диагностический алгоритм (Mermaid)

```typescript
// Использование
import DiagnosticAlgorithmMermaid from '@/components/DiagnosticAlgorithmMermaid';

export default function Page() {
  return <DiagnosticAlgorithmMermaid />;
}

// Результат: интерактивная блок-схема с 9 шагами
// Features:
// - ✅ Визуализация процесса
// - ✅ Цветовая кодировка
// - ✅ Легенда и пояснения
// - ✅ Адаптивный дизайн
```

### C. Диагностический алгоритм (React Flow)

```typescript
// Использование (более сложный вариант)
import DiagnosticAlgorithmFlow from '@/components/DiagnosticAlgorithmFlow';

export default function Page() {
  return <DiagnosticAlgorithmFlow />;
}

// Features:
// - ✅ Drag-and-drop
// - ✅ Интерактивность
// - ✅ Полностью кастомизируемо
```

---

## 5️⃣ API ENDPOINTS

### Сохранить опросник

```bash
POST /api/questionnaire/iciq-sf

Body:
{
  "frequency": 2,
  "amount": 4,
  "impact": 5,
  "sessionId": "abc-123"
}

Response:
{
  "success": true,
  "id": "quest-456",
  "score": 11,
  "timestamp": "2026-08-30T10:00:00Z"
}
```

### Экспортировать PDF

```bash
POST /api/export/pdf

Body:
{
  "questionnaireId": "quest-456"
}

Response: PDF файл (application/pdf)
```

---

## 6️⃣ БАЗА ДАННЫХ (ГЛАВНЫЕ ТАБЛИЦЫ)

```sql
-- Сессия пациента (анонимная)
UserSession {
  id, sessionToken, createdAt, expiresAt
}

-- Опросник (шифрованные ответы)
Questionnaire {
  id, userSessionId, type, encryptedAnswers,
  score, severity, createdAt
}

-- Записи дневника
DiaryEntry {
  id, userSessionId, date, time, volumeMl,
  urgency, leakageStatus
}

-- Результат (экспортированный PDF)
Result {
  id, questionnaireId, exportType, pdfPath,
  recipientEmail, accessToken, expiresAt
}

-- Врач
Doctor {
  id, email, medicalLicense, specialization,
  status, verifiedAt
}

-- Аудит (для GDPR)
AuditLog {
  id, action, actorId, resourceId, createdAt
}
```

**Ключевые особенности:**
- ✅ Шифрование (AES-256)
- ✅ Автоудаление через 90 дней
- ✅ Полный аудит
- ✅ GDPR compliant

---

## 7️⃣ GDPR COMPLIANCE (В ДВУХ СЛОВАХ)

```
Анонимные пациенты:
  90 дней → Автоудаление ✅

Зарегистрированные пациенты:
  - Могут скачать все данные ✅
  - Могут удалить аккаунт + данные ✅
  - Все операции аудитируются ✅

Врачи:
  - Видят только пациентов которые поделились ✅
  - Полная аудит-история ✅
  - Верификация лицензии ✅

Шифрование:
  - In-transit (HTTPS) ✅
  - At-rest (AES-256) ✅
  - Passwords (bcrypt) ✅
```

---

## 8️⃣ DEPLOYMENT CHECKLIST

### Перед запуском (Pre-launch)

```
☐ HTML валидация ✅
☐ CSS/JS тесты ✅
☐ GDPR политика одобрена юристом
☐ Данные пациентов шифруются (AES-256)
☐ SSL/TLS сертификат настроен
☐ Rate limiting включен
☐ Sentry для мониторинга ошибок
☐ Backup базы данных настроен
☐ Логирование аудита работает
☐ Пароли хешируются (bcrypt)
☐ Сайт проходит WCAG AAA
```

### На Railway

```
1. Создать новый проект в Railway
2. Подключить GitHub репозиторий
3. Railway автоматически:
   - Создаст PostgreSQL
   - Развернет приложение
   - Настроит SSL сертификат
4. Добавить environment variables в Railway dashboard
5. Запустить миграции: npx prisma migrate deploy
```

---

## 9️⃣ ВАЖНЫЕ ФАЙЛЫ КОТОРЫЕ ВЫЗВАТЬ

```
📄 README_TECHNICAL_PACKAGE.md
   └─ Start here! 5 шагов как начать

📄 ARCHITECTURE.md
   └─ Общая архитектура и flow

📄 DATABASE_SCHEMA_GDPR.md
   └─ Prisma schema (copy-paste в schema.prisma)

📄 TECH_STACK_RECOMMENDATIONS.md
   └─ Обоснование выбора + checklist

📄 IMPLEMENTATION_GUIDE.md
   └─ Пошаговые инструкции с кодом

📄 CODE_EXAMPLES.ts
   └─ Готовые функции (copy-paste)

📁 components/
   ├── ICIQSFQuestionnaire.tsx
   ├── DiagnosticAlgorithmMermaid.tsx
   └── DiagnosticAlgorithmFlow.tsx
```

---

## 🔟 КОМАНДЫ ДЛЯ РАЗРАБОТКИ

```bash
# Запустить dev сервер
npm run dev
# Открить http://localhost:3000

# Запустить Prisma Studio (управление БД визуально)
npx prisma studio
# Откроется http://localhost:5555

# Создать миграцию после изменения schema
npx prisma migrate dev --name add_new_table

# Запустить тесты
npm run test

# Линтинг
npm run lint

# Build для production
npm run build

# Запустить production build локально
npm run build && npm run start

# Проверить TypeScript ошибки
npx tsc --noEmit

# Сгенерировать Prisma Client (после изменения schema)
npx prisma generate
```

---

## 🎯 ГЛАВНЫЕ ЦИФРЫ

| Метрика | Значение |
|---------|----------|
| **Время до MVP** | 3-4 недели |
| **Стоимость инфраструктуры** | $50-100/мес |
| **Масштабируемость** | от 100 до 1M+ пользователей/день |
| **ICIQ-SF расчет** | < 50 мс |
| **PDF генерация** | < 2 сек |
| **Загрузка сайта** | < 2 сек (Core Web Vitals) |
| **Максимальный балл опросника** | 21 |
| **GDPR хранение данных** | 90 дней (анонимные) |
| **Шифрование** | AES-256 |
| **Языки** | 3 (RU/KK/EN) |

---

## ⚠️ КРИТИЧЕСКИЕ ВЕЩИ НЕ ЗАБЫТЬ

```
1. DATABASE_URL в .env.local (иначе Prisma не работает)
2. ENCRYPTION_KEY (должна быть 32 символа минимум)
3. npx prisma migrate dev (иначе таблицы не создаются)
4. Скопировать schema.prisma (иначе не будет структуры БД)
5. Установить TailwindCSS (иначе стили не работают)
6. node_modules/.bin/next build перед deployment
7. Включить HTTPS в production (SSL сертификат)
8. Настроить CORS для API (иначе CORS ошибки)
9. Включить Rate limiting (иначе DDoS уязвимость)
10. Добавить Sentry для мониторинга ошибок
```

---

## 🆘 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

| Проблема | Решение |
|----------|---------|
| `npm install` ошибка | Проверьте Node.js версию (18+), удалите node_modules |
| Prisma ошибка | Проверьте DATABASE_URL, запустите `npx prisma migrate dev` |
| TailwindCSS не работает | Проверьте tailwind.config.ts, перезагрузите dev сервер |
| Компонент не отображается | Проверьте import path, убедитесь зависимости установлены |
| Мобильная версия не работает | Проверьте @media queries в CSS, используйте DevTools |
| PDF не генерируется | Проверьте jsPDF установлена, логируйте ошибки в консоль |

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- **Prisma Docs:** https://www.prisma.io/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **TailwindCSS:** https://tailwindcss.com/docs
- **React Flow:** https://reactflow.dev/docs
- **Mermaid:** https://mermaid.js.org/
- **jsPDF:** https://github.com/parallax/jspdf

---

## ✨ ИТОГО

Вы готовы! Вот все что вам нужно:

1. **Next.js проект** ← инициализировать за 5 мин
2. **Компоненты** ← готовы, просто скопируйте
3. **API endpoints** ← примеры в IMPLEMENTATION_GUIDE.md
4. **БД схема** ← Prisma ready, просто copy-paste
5. **Deployment** ← Railway за 10 мин
6. **GDPR compliance** ← встроено в схему

**Начните сегодня, запустите MVP через 3 недели!** 🚀

---

**Последний файл создан:** 2026-08-30
**Всего документов:** 10 (включая этот файл)
**Статус:** Ready for action ✅

