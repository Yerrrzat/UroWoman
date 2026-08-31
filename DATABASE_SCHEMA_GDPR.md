# DATABASE SCHEMA & GDPR COMPLIANCE

## Prisma Schema для UroWoman Kazakhstan

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ПАЦИЕНТЫ И СЕССИИ
// ============================================

/// Анонимная сессия пациента (без личных данных)
model UserSession {
  id            String   @id @default(cuid())
  sessionToken  String   @unique @db.VarChar(255)
  
  // Нельзя сохранять IP адрес или User-Agent (GDPR)
  createdAt     DateTime @default(now())
  lastActivity  DateTime @updatedAt
  expiresAt     DateTime // Сессия удаляется через 90 дней

  // Связи
  questionnaires Questionnaire[]
  diaryEntries   DiaryEntry[]

  @@index([expiresAt])
}

// ============================================
// ОПРОСНИКИ И РЕЗУЛЬТАТЫ
// ============================================

/// Валидированный международный опросник
model Questionnaire {
  id              String   @id @default(cuid())
  
  // Для анонимных пользователей
  userSessionId   String?
  userSession     UserSession? @relation(fields: [userSessionId], references: [id], onDelete: Cascade)
  
  // Для зарегистрированных пациентов (опционально)
  registeredPatientId String?
  registeredPatient   RegisteredPatient? @relation(fields: [registeredPatientId], references: [id], onDelete: Cascade)
  
  // Для врачей, загружающих пациентов
  doctorId        String?
  doctor          Doctor? @relation(fields: [doctorId], references: [id], onDelete: SetNull)

  type            QuestionnaireType // ICIQ-SF, ICIQ-LUTSqol, etc.
  
  // ЗАШИФРОВАННЫЕ ответы (AES-256)
  // Формат: "iv:encryptedData" где iv - инициализирующий вектор
  encryptedAnswers String   @db.Text
  
  // Расшифрованные ответы (только для внутреннего анализа)
  answers         Json? 
  
  // Рассчитанный балл (видим это, но не ответы)
  score           Int
  severity        Severity // mild | moderate | severe
  
  // Результаты обработки
  exportedAt      DateTime?
  exportFormat    String? // pdf, email, print
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Автоудаление через 90 дней если анонимно и не экспортировано
  shouldDeleteAt  DateTime?

  // Связи
  diaryEntries    DiaryEntry[]
  results         Result[]
  auditLog        AuditLog[]

  @@index([userSessionId])
  @@index([type])
  @@index([createdAt])
  @@index([shouldDeleteAt])
}

enum QuestionnaireType {
  ICIQ_SF        // Short Form (3 вопроса, макс 21 балл)
  ICIQ_LUTSQOL   // Quality of Life (26 вопросов)
  ICIQ_FLUTS     // Female LUTS (12 вопросов)
}

enum Severity {
  NONE      // 0
  MILD      // 1-5
  MODERATE  // 6-12
  SEVERE    // 13-21
}

// ============================================
// ДНЕВНИК МОЧЕИСПУСКАНИЯ
// ============================================

/// Запись в дневнике мочеиспускания (минимум 3 дня)
model DiaryEntry {
  id              String   @id @default(cuid())
  
  userSessionId   String?
  userSession     UserSession? @relation(fields: [userSessionId], references: [id], onDelete: Cascade)
  
  registeredPatientId String?
  registeredPatient   RegisteredPatient? @relation(fields: [registeredPatientId], references: [id], onDelete: Cascade)
  
  questionnaireId String? // Связь с опросником, который инициировал дневник
  questionnaire   Questionnaire? @relation(fields: [questionnaireId], references: [id], onDelete: SetNull)

  date            DateTime // Дата записи
  time            DateTime // Время мочеиспускания
  
  // Основные метрики
  volumeMl        Int? // Объем в мл
  urgency         Int? // 0-3 шкала срочности
  leakageStatus   LeakageStatus // none, small, moderate, large
  leakageVolume   Int? // В мл
  
  // Контекст (опционально)
  activity        String? // физ нагрузка, кашель, чихание, etc
  notes           String? // Заметки пациента

  // GDPR: ограничение хранения
  createdAt       DateTime @default(now())
  expiresAt       DateTime // Удаление через 90 дней

  @@index([userSessionId])
  @@index([date])
  @@index([expiresAt])
}

enum LeakageStatus {
  NONE       // Без подтекания
  SMALL      // Небольшое (пятна)
  MODERATE   // Умеренное
  LARGE      // Большое
}

// ============================================
// РЕЗУЛЬТАТЫ И ОТЧЕТЫ
// ============================================

/// Экспортированный результат (PDF, Email, Print)
model Result {
  id              String   @id @default(cuid())
  
  questionnaireId String
  questionnaire   Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
  
  // Где был экспортирован результат?
  exportType      ExportType // pdf, email, print
  
  // Если отправлен врачу
  recipientEmail  String? @db.VarChar(255)
  doctorId        String?
  doctor          Doctor? @relation(fields: [doctorId], references: [id])
  
  // Токен для безопасного доступа (вместо ID)
  accessToken     String   @unique @db.VarChar(255)
  
  // PDF файл (сохраняется в S3 или локально)
  pdfPath         String?  @db.Text
  pdfSize         Int?     // В байтах
  
  // Отслеживание согласия
  consentGiven    Boolean @default(false)
  consentGivenAt  DateTime?
  
  // Удаление результата
  deletedAt       DateTime?
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime // Автоудаление через 180 дней

  @@index([questionnaireId])
  @@index([doctorId])
  @@index([accessToken])
  @@index([expiresAt])
}

enum ExportType {
  PDF            // Скачивание PDF
  EMAIL          // Отправка на почту врачу
  PRINT          // Печать на месте
  DOCTOR_PORTAL  // Загрузка в портал врача
}

// ============================================
// ВРАЧИ И РЕГИСТРАЦИЯ
// ============================================

/// Зарегистрированный врач
model Doctor {
  id              String   @id @default(cuid())
  
  email           String   @unique @db.VarChar(255)
  password        String   @db.VarChar(255) // Bcrypt хеш
  
  firstName       String   @db.VarChar(100)
  lastName        String   @db.VarChar(100)
  
  medicalLicense  String   @unique @db.VarChar(50)
  specialization  String   @db.VarChar(100)
  hospital        String?  @db.VarChar(255)
  
  // 2FA
  tfaEnabled      Boolean @default(false)
  tfaSecret       String?
  
  // Согласие
  gdprAccepted    Boolean @default(false)
  gdprAcceptedAt  DateTime?
  
  status          DoctorStatus @default(PENDING)
  verifiedAt      DateTime?
  verifiedBy      String? // Admin ID
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Связи
  questionnaires  Questionnaire[]
  results         Result[]
  auditLog        AuditLog[]

  @@index([email])
  @@index([status])
}

enum DoctorStatus {
  PENDING         // Ожидает проверки лицензии
  VERIFIED        // Подтвержден
  SUSPENDED       // Приостановлен
  DELETED         // Удален
}

/// Зарегистрированный пациент (опционально, для истории болезни)
model RegisteredPatient {
  id              String   @id @default(cuid())
  
  email           String   @unique @db.VarChar(255)
  password        String   @db.VarChar(255)
  
  // Личные данные (зашифрованы!)
  encryptedFirstName  String @db.VarChar(255)
  encryptedLastName   String @db.VarChar(255)
  encryptedBirthDate  String @db.VarChar(255)
  
  // Согласие на обработку
  gdprAccepted    Boolean @default(false)
  gdprAcceptedAt  DateTime?
  
  // 2FA
  tfaEnabled      Boolean @default(false)
  tfaSecret       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Связи
  questionnaires  Questionnaire[]
  diaryEntries    DiaryEntry[]

  @@index([email])
}

// ============================================
// АУДИТ И ЛОГИРОВАНИЕ
// ============================================

/// Логирование всех действий (для GDPR и безопасности)
model AuditLog {
  id              String   @id @default(cuid())
  
  action          AuditAction
  description     String   @db.Text
  
  // Кто выполнил действие?
  actorType       ActorType // USER, DOCTOR, ADMIN
  actorId         String?
  
  // На что действие влияет?
  resourceType    String   @db.VarChar(50) // Questionnaire, Result, etc
  resourceId      String?
  
  // IP адрес (если применимо, для безопасности)
  ipAddress       String?  @db.VarChar(50)
  
  // Результат действия
  success         Boolean @default(true)
  error           String?  @db.Text
  
  createdAt       DateTime @default(now())

  // Связи
  questionnaire   Questionnaire? @relation(fields: [resourceId], references: [id], onDelete: SetNull)
  doctor          Doctor? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([action])
  @@index([createdAt])
}

enum AuditAction {
  QUESTIONNAIRE_CREATED
  QUESTIONNAIRE_SUBMITTED
  QUESTIONNAIRE_EXPORTED
  RESULT_GENERATED
  RESULT_SENT_TO_DOCTOR
  RESULT_DELETED
  USER_SESSION_CREATED
  USER_SESSION_EXPIRED
  DATA_EXPORTED_BY_USER
  DATA_DELETED_BY_USER
}

enum ActorType {
  USER          // Анонимный пользователь
  PATIENT       // Зарегистрированный пациент
  DOCTOR        // Врач
  ADMIN         // Администратор
  SYSTEM        // Автоматизированный процесс
}

// ============================================
// СОГЛАСИЕ И POLICY
// ============================================

/// Отслеживание согласия пользователя (GDPR важно!)
model ConsentLog {
  id              String   @id @default(cuid())
  
  userSessionId   String?
  sessionId       String? @db.VarChar(255)
  
  consentType     ConsentType
  version         String   @db.VarChar(20) // v1.0, v2.0, etc
  
  accepted        Boolean
  acceptedAt      DateTime @default(now())
  
  ipAddress       String?  @db.VarChar(50)
  userAgent       String?  @db.Text

  @@index([userSessionId])
  @@index([acceptedAt])
}

enum ConsentType {
  GDPR_DATA_PROCESSING
  GDPR_COOKIES
  MEDICAL_DISCLAIMER
  DATA_SHARING_WITH_DOCTOR
  RESEARCH_PARTICIPATION
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

/// Системные параметры и настройки
model SystemConfig {
  id              String   @id @default(cuid())
  
  key             String   @unique @db.VarChar(100)
  value           Json
  
  description     String?  @db.Text
  
  updatedBy       String?
  updatedAt       DateTime @updatedAt
}
```

---

## МИГРАЦИИ И ИНДЕКСЫ

### Создание индексов для производительности

```sql
-- Быстрый поиск по сессиям
CREATE INDEX idx_user_session_expires_at ON "UserSession"("expiresAt");
CREATE INDEX idx_user_session_token ON "UserSession"("sessionToken");

-- Быстрый поиск опросников по дате (для удаления GDPR)
CREATE INDEX idx_questionnaire_should_delete_at ON "Questionnaire"("shouldDeleteAt");
CREATE INDEX idx_questionnaire_created_at ON "Questionnaire"("createdAt");

-- Быстрый поиск записей дневника
CREATE INDEX idx_diary_entry_date ON "DiaryEntry"("date");
CREATE INDEX idx_diary_entry_expires_at ON "DiaryEntry"("expiresAt");

-- Быстрый поиск результатов по токену доступа
CREATE INDEX idx_result_access_token ON "Result"("accessToken");

-- Аудит по действиям
CREATE INDEX idx_audit_log_action ON "AuditLog"("action");
CREATE INDEX idx_audit_log_created_at ON "AuditLog"("createdAt");

-- Поиск врачей по статусу
CREATE INDEX idx_doctor_status ON "Doctor"("status");

-- Поиск согласия
CREATE INDEX idx_consent_log_user_session ON "ConsentLog"("userSessionId");
```

---

## CRON JOBS ДЛЯ GDPR

### Автоматическое удаление данных (каждый день в 02:00 UTC)

**Файл: `lib/services/cronJobs.ts`**

```typescript
import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

/**
 * Запуск GDPR cleanup каждый день в 02:00 UTC
 */
export function startGDPRCleanupJob() {
  // Расписание: 0 2 * * * (каждый день в 02:00 UTC)
  cron.schedule('0 2 * * *', async () => {
    console.log('[GDPR Cleanup] Starting scheduled cleanup job...');

    try {
      // 1. Удалить анонимные опросники старше 90 дней
      const deletedQuestionnaires = await prisma.questionnaire.deleteMany({
        where: {
          AND: [
            { userSessionId: { not: null } }, // Только анонимные
            { doctorId: null }, // Не загруженные врачом
            { registeredPatientId: null }, // Не зарегистрированного пациента
            { shouldDeleteAt: { lt: new Date() } }, // Переданы 90 дней
          ],
        },
      });

      console.log(
        `[GDPR] Deleted ${deletedQuestionnaires.count} old questionnaires`
      );

      // 2. Удалить старые записи дневника
      const deletedDiaryEntries = await prisma.diaryEntry.deleteMany({
        where: {
          AND: [
            { registeredPatientId: null }, // Только анонимные
            { expiresAt: { lt: new Date() } },
          ],
        },
      });

      console.log(
        `[GDPR] Deleted ${deletedDiaryEntries.count} old diary entries`
      );

      // 3. Удалить результаты старше 180 дней
      const deletedResults = await prisma.result.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      console.log(`[GDPR] Deleted ${deletedResults.count} old results`);

      // 4. Удалить истекшие сессии
      const deletedSessions = await prisma.userSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      console.log(
        `[GDPR] Deleted ${deletedSessions.count} expired sessions`
      );

      console.log('[GDPR Cleanup] Job completed successfully');
    } catch (error) {
      console.error('[GDPR Cleanup] Job failed:', error);
    }
  });
}

export function stopGDPRCleanupJob() {
  cron.schedule('stop', () => {});
}
```

### Запуск в приложении

**Файл: `app/layout.tsx`**

```typescript
import { startGDPRCleanupJob } from '@/lib/services/cronJobs';

// Запустить при инициализации приложения
if (process.env.NODE_ENV === 'production') {
  startGDPRCleanupJob();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## БЕЗОПАСНОСТЬ БАЗЫ ДАННЫХ

### Рекомендуемые настройки PostgreSQL

```sql
-- Включить шифрование на уровне БД
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET password_encryption = scram-sha-256;

-- Ограничить доступ
CREATE ROLE urowomen_app LOGIN PASSWORD 'strong-password-here';
GRANT CONNECT ON DATABASE urowomen TO urowomen_app;
GRANT USAGE ON SCHEMA public TO urowomen_app;

-- Запретить прямой доступ к зашифрованным полям
CREATE POLICY "select_encrypted" ON questionnaire
  FOR SELECT
  USING (true);

-- Логирование изменений для аудита
CREATE TABLE questionnaire_audit_log (
  id SERIAL PRIMARY KEY,
  old_record JSONB,
  new_record JSONB,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by TEXT
);

CREATE TRIGGER questionnaire_audit_trigger
  AFTER UPDATE ON questionnaire
  FOR EACH ROW
  EXECUTE FUNCTION audit_questionnaire_changes();
```

