# UroWoman Kazakhstan — Практический гайд по внедрению

## ЧАСТЬ 1: БЫСТРЫЙ СТАРТ (2-3 недели)

### 1.1 Инициализация Next.js проекта

```bash
# Создание нового Next.js проекта с TypeScript и TailwindCSS
npx create-next-app@latest urowomen-platform --typescript --tailwind --eslint

cd urowomen-platform

# Установка необходимых зависимостей
npm install react-flow-renderer mermaid jspdf pdfmake chart.js recharts zustand react-query
npm install -D @types/jspdf @types/pdfmake
```

### 1.2 Структура проекта

```
urowomen-platform/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Корневой layout
│   ├── page.tsx                  # Главная страница
│   ├── api/
│   │   ├── questionnaire/        # API for ICIQ-SF
│   │   ├── diary/                # API for voiding diary
│   │   └── export/               # API for PDF export
│   ├── patient/                  # Patient section
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── types/
│   │   └── exercises/
│   ├── doctor/                   # Doctor section
│   │   ├── guidelines/
│   │   ├── algorithms/
│   │   └── literature/
│   ├── research/                 # Research section
│   └── tools/                    # Interactive tools
│       ├── iciq-sf/
│       ├── diary/
│       └── algorithms/
├── components/
│   ├── ICIQSFQuestionnaire.tsx
│   ├── DiagnosticAlgorithmFlow.tsx
│   ├── DiagnosticAlgorithmMermaid.tsx
│   ├── VoidingDiaryForm.tsx
│   ├── Navigation.tsx
│   ├── LanguageSwitcher.tsx
│   └── ui/                       # Shadcn/ui components
├── lib/
│   ├── store/                    # Zustand stores
│   │   ├── questionnaireStore.ts
│   │   └── diaryStore.ts
│   ├── utils/
│   │   ├── scoring.ts            # ICIQ-SF scoring logic
│   │   ├── encryption.ts         # Data encryption
│   │   └── pdfGenerator.ts       # PDF export
│   └── constants/
│       ├── languages.ts
│       └── colors.ts
├── styles/
│   └── globals.css               # TailwindCSS styles
├── public/
│   ├── logos/
│   ├── icons/
│   └── images/
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.local                    # Environment variables
└── next.config.ts                # Next.js config
```

### 1.3 Установка и настройка Prisma

```bash
# Установка Prisma
npm install @prisma/client
npm install -D prisma

# Инициализация Prisma (выбрать PostgreSQL)
npx prisma init

# Создание миграций
npx prisma migrate dev --name init
```

---

## ЧАСТЬ 2: КОМПОНЕНТЫ И ФУНКЦИОНАЛЬНОСТЬ

### 2.1 Интеграция ICIQ-SF компонента

**Файл: `app/tools/iciq-sf/page.tsx`**

```typescript
'use client';

import React from 'react';
import ICIQSFQuestionnaire from '@/components/ICIQSFQuestionnaire';

export default function ICIQSFPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Опросник ICIQ-SF
          </h1>
          <p className="text-lg text-gray-600">
            Определите степень тяжести недержания мочи за 2 минуты
          </p>
        </div>
        
        <ICIQSFQuestionnaire />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Как пользоваться опросником?</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Ответьте честно на все 3 вопроса</li>
            <li>Система автоматически рассчитает ваш результат</li>
            <li>Скачайте результаты в PDF для консультации врача</li>
            <li>Покажите результаты специалисту при визите</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
```

### 2.2 Интеграция алгоритма диагностики

**Файл: `app/tools/algorithms/page.tsx`**

```typescript
'use client';

import React from 'react';
import DiagnosticAlgorithmMermaid from '@/components/DiagnosticAlgorithmMermaid';
// или для более сложной версии:
// import DiagnosticAlgorithmFlow from '@/components/DiagnosticAlgorithmFlow';

export default function AlgorithmsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <DiagnosticAlgorithmMermaid
          title="Алгоритм диагностики недержания мочи"
          description="Интерактивная схема помощи пациенткам и врачам"
        />
      </div>
    </div>
  );
}
```

---

## ЧАСТЬ 3: API ENDPOINTS

### 3.1 API для сохранения результатов опросника

**Файл: `app/api/questionnaire/iciq-sf/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptData } from '@/lib/utils/encryption';

interface ICIQSFRequest {
  frequency: number;
  amount: number;
  impact: number;
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ICIQSFRequest = await request.json();

    // Валидация данных
    if (
      typeof body.frequency !== 'number' ||
      typeof body.amount !== 'number' ||
      typeof body.impact !== 'number' ||
      !body.sessionId
    ) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Расчет общего балла
    const score = body.frequency + body.amount + body.impact;

    // Шифрование данных перед сохранением
    const encryptedAnswers = encryptData(
      JSON.stringify({
        frequency: body.frequency,
        amount: body.amount,
        impact: body.impact,
      })
    );

    // Сохранение в БД
    const questionnaire = await prisma.questionnaires.create({
      data: {
        userId: body.sessionId,
        type: 'ICIQ-SF',
        answers: encryptedAnswers,
        score: score,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: questionnaire.id,
      score: score,
      timestamp: questionnaire.createdAt,
    });
  } catch (error) {
    console.error('Error saving questionnaire:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 API для экспорта PDF

**Файл: `app/api/export/pdf/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

interface ExportRequest {
  questionnaireType: string;
  answers: Record<string, any>;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();

    // Создание PDF документа
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Заголовок
    doc.setFontSize(18);
    doc.text('UroWoman Kazakhstan', 15, 20);
    
    doc.setFontSize(14);
    doc.text('Результаты опросника ICIQ-SF', 15, 35);

    // Результаты
    doc.setFontSize(12);
    doc.text(`Общий балл: ${body.score} из 21`, 15, 55);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 15, 65);

    // Дисклеймер
    doc.setFontSize(9);
    doc.setTextColor(200, 0, 0);
    const disclaimer =
      'ВАЖНО: Результаты этого опросника являются информационными ' +
      'и не заменяют консультацию врача.';
    doc.text(
      doc.splitTextToSize(disclaimer, pageWidth - 30),
      15,
      85
    );

    // Отправка PDF
    const pdfBytes = doc.output('arraybuffer');
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ICIQ-SF_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

---

## ЧАСТЬ 4: МНОГОЯЗЫЧНОСТЬ

### 4.1 Настройка i18n

**Файл: `lib/i18n/translations.ts`**

```typescript
export const translations = {
  ru: {
    nav: {
      home: 'Главная',
      patient: 'Для пациенток',
      doctor: 'Для врачей',
      research: 'Научные исследования',
      tools: 'Инструменты',
    },
    iciqsf: {
      title: 'Опросник ICIQ-SF',
      question1: 'Как часто у вас бывает непроизвольная потеря мочи?',
      question2: 'Какое количество мочи обычно вы теряете?',
      question3: 'Насколько недержание влияет на вашу жизнь?',
    },
  },
  kk: {
    nav: {
      home: 'Басы бет',
      patient: 'Науқастар үшін',
      doctor: 'Дәрігерлер үшін',
      research: 'Ғылыми зерттеулер',
      tools: 'Құралдар',
    },
    iciqsf: {
      title: 'ICIQ-SF сауалнамасы',
      question1: 'Сіз қаншалықты жиі ісінің бақсы өтінігін жоғалтасыз?',
      question2: 'Әдетте сіз қанша ісінің бақсы өтінігін жоғалтасыз?',
      question3: 'Іс-тұқым ретінде сіздің өміңіздіге қаншалықты әсер етеді?',
    },
  },
  en: {
    nav: {
      home: 'Home',
      patient: 'For Patients',
      doctor: 'For Doctors',
      research: 'Research',
      tools: 'Tools',
    },
    iciqsf: {
      title: 'ICIQ-SF Questionnaire',
      question1: 'How often do you experience involuntary urine loss?',
      question2: 'What amount of urine do you usually lose?',
      question3: 'How much does incontinence affect your quality of life?',
    },
  },
};

export type Language = 'ru' | 'kk' | 'en';
```

### 4.2 Language Switcher компонент

**Файл: `components/LanguageSwitcher.tsx`**

```typescript
'use client';

import React from 'react';
import { useLanguage } from '@/lib/hooks/useLanguage';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      {['ru', 'kk', 'en'].map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang as any)}
          className={`px-3 py-1 rounded ${
            language === lang
              ? 'bg-teal-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
```

---

## ЧАСТЬ 5: БЕЗОПАСНОСТЬ И GDPR

### 5.1 Шифрование данных

**Файл: `lib/utils/encryption.ts`**

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-minimum';

export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );

  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 5.2 GDPR Compliance — Автоудаление данных

**Файл: `lib/services/gdprService.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { decryptData } from '@/lib/utils/encryption';

/**
 * Автоматическое удаление данных через 90 дней
 * Запускается каждый день через Cron Job
 */
export async function deleteOldAnonymousData() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const deletedRecords = await prisma.questionnaires.deleteMany({
    where: {
      createdAt: {
        lt: ninetyDaysAgo,
      },
      // Удаляем только анонимные данные (без привязки к врачу)
      doctorId: null,
    },
  });

  console.log(
    `[GDPR] Удалено ${deletedRecords.count} старых анонимных записей`
  );
}

/**
 * Экспорт данных пациента (право на портативность)
 */
export async function exportUserData(sessionId: string) {
  const questionnaires = await prisma.questionnaires.findMany({
    where: { userId: sessionId },
  });

  const diaryEntries = await prisma.diaryEntries.findMany({
    where: { userId: sessionId },
  });

  return {
    questionnaires: questionnaires.map((q) => ({
      ...q,
      answers: decryptData(q.answers), // Расшифровываем
    })),
    diaryEntries,
    exportedAt: new Date(),
  };
}

/**
 * Удаление всех данных пациента
 */
export async function deleteAllUserData(sessionId: string) {
  await prisma.questionnaires.deleteMany({
    where: { userId: sessionId },
  });

  await prisma.diaryEntries.deleteMany({
    where: { userId: sessionId },
  });

  return {
    success: true,
    message: 'Все данные пользователя удалены',
  };
}
```

---

## ЧАСТЬ 6: DEPLOYMENT

### 6.1 Docker setup

**Файл: `Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Файл: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/urowomen
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: urowomen
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

### 6.2 GitHub Actions CI/CD

**Файл: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 6.3 Environment Variables

**Файл: `.env.local.example`**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/urowomen

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Third-party services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

---

## ЧАСТЬ 7: ТЕСТИРОВАНИЕ

### 7.1 Unit Tests

**Файл: `lib/utils/__tests__/scoring.test.ts`**

```typescript
import { calculateICIQSFScore, determineSeverity } from '../scoring';

describe('ICIQ-SF Scoring', () => {
  it('should calculate correct score', () => {
    const score = calculateICIQSFScore({
      frequency: 1,
      amount: 2,
      impact: 5,
    });
    expect(score).toBe(8);
  });

  it('should determine mild severity for low score', () => {
    const severity = determineSeverity(3);
    expect(severity).toBe('mild');
  });

  it('should determine severe severity for high score', () => {
    const severity = determineSeverity(20);
    expect(severity).toBe('severe');
  });
});
```

---

## ПЛАН РЕАЛИЗАЦИИ ПО ЭТАПАМ

| Этап | Недели | Задачи | Результат |
|------|--------|--------|-----------|
| **Подготовка** | 1-2 | Инициализация Next.js, Prisma, DB | Готовая разработка среда |
| **Миграция** | 2-3 | Перенос HTML → React, CSS → TailwindCSS | Все страницы работают в React |
| **Компоненты** | 3-4 | ICIQ-SF, Дневник, Алгоритмы | Интерактивные инструменты готовы |
| **Backend** | 4-5 | API endpoints, шифрование, GDPR | API полностью функционален |
| **Testing** | 5-6 | Unit tests, E2E tests, Security audit | 80%+ code coverage |
| **Deployment** | 6-7 | Docker, CI/CD, Vercel/Railway setup | Сайт в продакшене |

