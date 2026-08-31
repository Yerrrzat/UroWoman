/**
 * QUICK START CODE EXAMPLES
 * Готовые примеры для быстрого начала разработки
 */

// ============================================
// 1. SCORING UTILITY
// ============================================

/**
 * lib/utils/scoring.ts
 * Расчет баллов ICIQ-SF
 */

export interface ICIQSFAnswers {
  frequency: number; // 0-5
  amount: number;    // 0, 2, 4, 6
  impact: number;    // 0-10
}

export interface ScoringResult {
  score: number;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
  recommendations: string[];
}

export function calculateICIQSFScore(answers: ICIQSFAnswers): ScoringResult {
  const { frequency, amount, impact } = answers;

  // Расчет общего балла
  const score = frequency + amount + impact;

  // Определение тяжести
  let severity: 'none' | 'mild' | 'moderate' | 'severe';
  if (score === 0) {
    severity = 'none';
  } else if (score <= 5) {
    severity = 'mild';
  } else if (score <= 12) {
    severity = 'moderate';
  } else {
    severity = 'severe';
  }

  // Интерпретация
  const interpretations = {
    none: 'Симптомы недержания отсутствуют',
    mild: 'Легкое недержание мочи',
    moderate: 'Среднетяжелое недержание мочи',
    severe: 'Тяжелое недержание мочи',
  };

  // Рекомендации
  const recommendationsMap = {
    none: [
      'Профилактический контроль 1 раз в год',
      'Здоровый образ жизни',
    ],
    mild: [
      'Упражнения Кегеля (тренировка тазового дна)',
      'Коррекция образа жизни (избегать кофеина)',
      'Консультация врача рекомендуется',
    ],
    moderate: [
      'Тренировка мышц тазового дна (упр. Кегеля)',
      'При ургентном типе: М-холиноблокаторы',
      'Обязательная консультация врача',
      'Физиотерапия рекомендуется',
    ],
    severe: [
      'Срочная консультация урогинеколога',
      'Комплексное обследование',
      'Возможно хирургическое лечение',
      'Специализированный уход',
    ],
  };

  return {
    score,
    severity,
    interpretation: interpretations[severity],
    recommendations: recommendationsMap[severity],
  };
}

// ============================================
// 2. ZUSTAND STORE
// ============================================

/**
 * lib/store/questionnaireStore.ts
 * State management для опросников
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateICIQSFScore, type ICIQSFAnswers } from '@/lib/utils/scoring';

interface QuestionnaireState {
  // Данные опросника
  answers: ICIQSFAnswers | null;
  isAnswered: boolean;
  result: ReturnType<typeof calculateICIQSFScore> | null;

  // Методы
  setAnswers: (answers: Partial<ICIQSFAnswers>) => void;
  submitQuestionnaire: () => void;
  resetQuestionnaire: () => void;
  getSessionData: () => object;
}

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
    (set, get) => ({
      answers: null,
      isAnswered: false,
      result: null,

      setAnswers: (newAnswers) =>
        set((state) => ({
          answers: state.answers ? { ...state.answers, ...newAnswers } : (newAnswers as ICIQSFAnswers),
        })),

      submitQuestionnaire: () => {
        const { answers } = get();
        if (answers) {
          const result = calculateICIQSFScore(answers);
          set({ result, isAnswered: true });
        }
      },

      resetQuestionnaire: () =>
        set({
          answers: null,
          isAnswered: false,
          result: null,
        }),

      getSessionData: () => {
        const { answers, result } = get();
        return { answers, result, savedAt: new Date().toISOString() };
      },
    }),
    {
      name: 'questionnaire-store',
      partialize: (state) => ({
        answers: state.answers,
        result: state.result,
        isAnswered: state.isAnswered,
      }),
    }
  )
);

// ============================================
// 3. PDF GENERATOR UTILITY
// ============================================

/**
 * lib/utils/pdfGenerator.ts
 * Генерация PDF отчетов
 */

import jsPDF from 'jspdf';
import { type ScoringResult } from './scoring';

export interface PDFReportData {
  patientId?: string; // Опционально, может быть анонимным
  questionnaireType: string;
  answers: Record<string, any>;
  result: ScoringResult;
  timestamp: Date;
  disclaimer?: boolean;
}

export async function generatePDFReport(data: PDFReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Заголовок
  doc.setFontSize(20);
  doc.setTextColor(8, 127, 123); // Тиловый цвет
  doc.text('UroWoman Kazakhstan', margin, yPosition);
  yPosition += 12;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Результаты опросника ICIQ-SF', margin, yPosition);
  yPosition += 10;

  // Информация о отчете
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  const dateStr = data.timestamp.toLocaleDateString('ru-RU');
  const timeStr = data.timestamp.toLocaleTimeString('ru-RU');
  doc.text(`Дата: ${dateStr} ${timeStr}`, margin, yPosition);

  if (data.patientId) {
    yPosition += 5;
    doc.text(`ID пациента: ${data.patientId}`, margin, yPosition);
  }
  yPosition += 10;

  // Результат (большой и яркий)
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Общий балл: ${data.result.score} из 21`, margin, yPosition);
  yPosition += 10;

  // Тяжесть
  doc.setFontSize(12);
  const severityColors = {
    none: [34, 197, 94],     // Зеленый
    mild: [34, 197, 94],     // Зеленый
    moderate: [234, 179, 8], // Желтый
    severe: [239, 68, 68],   // Красный
  };

  const color = severityColors[data.result.severity];
  doc.setTextColor(...color);
  doc.text(
    `Тяжесть: ${data.result.interpretation}`,
    margin,
    yPosition
  );
  yPosition += 10;

  // Ответы
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text('Ответы на вопросы:', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  const frequencyLabel = [
    'Никогда',
    'Раз в неделю или реже',
    'Два-три раза в неделю',
    'Примерно раз в день',
    'Несколько раз в день',
    'Постоянно',
  ][data.answers.frequency] || 'Неизвестно';

  doc.text(`• Частота подтекания: ${frequencyLabel}`, margin + 5, yPosition);
  yPosition += 6;

  const amountLabel = ['Нет', 'Небольшое', 'Умеренное', 'Большое'][data.answers.amount / 2] || 'Неизвестно';
  doc.text(`• Объем подтекания: ${amountLabel}`, margin + 5, yPosition);
  yPosition += 6;

  doc.text(`• Влияние на жизнь (0-10): ${data.answers.impact}`, margin + 5, yPosition);
  yPosition += 12;

  // Рекомендации
  doc.setFontSize(11);
  doc.text('Рекомендации:', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  data.result.recommendations.forEach((rec) => {
    const splitText = doc.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 5);
    doc.text(splitText, margin + 5, yPosition);
    yPosition += splitText.length * 5 + 2;
  });

  yPosition += 5;

  // Дисклеймер
  if (data.disclaimer !== false) {
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38); // Красный
    const disclaimer =
      'ВАЖНО: Результаты этого опросника являются информационными и НЕ ЗАМЕНЯЮТ ' +
      'консультацию квалифицированного врача. Для точной диагностики и назначения ' +
      'лечения обратитесь к специалисту.';
    const splitDisclaimer = doc.splitTextToSize(
      disclaimer,
      pageWidth - 2 * margin
    );
    doc.text(splitDisclaimer, margin, Math.min(yPosition, pageHeight - margin - 20));
  }

  // Футер
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `UroWoman Kazakhstan | www.urowomen.kz | Сгенерировано: ${new Date().toISOString()}`,
    margin,
    pageHeight - margin + 5
  );

  // Получить PDF как Blob
  return new Promise((resolve) => {
    doc.output('blob').then((blob) => resolve(blob));
  });
}

// ============================================
// 4. API HOOK
// ============================================

/**
 * hooks/useQuestionnaireAPI.ts
 * Hook для работы с API опросника
 */

import { useMutation, useQuery } from '@tanstack/react-query';

export interface SaveQuestionnairePayload {
  frequency: number;
  amount: number;
  impact: number;
  sessionId: string;
}

export interface SaveQuestionnaireResponse {
  success: boolean;
  id: string;
  score: number;
  timestamp: string;
}

export const useSaveQuestionnaire = () => {
  return useMutation<SaveQuestionnaireResponse, Error, SaveQuestionnairePayload>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/questionnaire/iciq-sf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save questionnaire');
      }

      return response.json();
    },
  });
};

export const useExportPDF = () => {
  return useMutation<Blob, Error, { questionnaireId: string }>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      return response.blob();
    },
  });
};

// ============================================
// 5. ДИАГНОСТИЧЕСКИЙ АЛГОРИТМ (MERMAID)
// ============================================

/**
 * Готовый Mermaid диаграмма для блок-схемы
 */

export const DIAGNOSTIC_ALGORITHM_MERMAID = `
graph TD
    Start["👩 <b>Пациентка приходит<br/>с жалобами</b>"] --> ICIQ["📋 <b>ICIQ-SF</b><br/>Оценка симптомов"]
    
    ICIQ --> Decision1{🤔 <b>Есть ли<br/>симптомы?</b>}
    
    Decision1 -->|Нет| NoSymptoms["✅ <b>Наблюдение</b><br/>Повтор через год"]
    Decision1 -->|Да| PhysicalExam["🔍 <b>Осмотр + Кашлевая проба</b>"]
    
    PhysicalExam --> Diary["📊 <b>Дневник</b><br/>(3 дня)"]
    Diary --> UrineTest["🧪 <b>Анализ мочи</b><br/>+ УЗИ"]
    
    UrineTest --> Decision2{📌 <b>Тип?</b>}
    
    Decision2 -->|💪 Стрессовое| TypeStress["<b>Стрессовое<br/>недержание</b>"]
    Decision2 -->|⚠️ Ургентное| TypeUrgency["<b>Ургентное<br/>недержание</b>"]
    Decision2 -->|🔄 Смешанное| TypeMixed["<b>Смешанное<br/>недержание</b>"]
    
    TypeStress --> Treatment["💊 <b>Консервативное<br/>лечение</b>"]
    TypeUrgency --> Treatment
    TypeMixed --> Treatment
    
    Treatment --> Control["⏱️ <b>Контроль 3 мес</b>"]
    Control --> Decision3{✨ <b>Эффект?</b>}
    
    Decision3 -->|Да| Continue["✅ <b>Продолжить</b>"]
    Decision3 -->|Нет| Refer["🏥 <b>Направление<br/>к специалисту</b>"]
    
    NoSymptoms --> End1["🎯 <b>Конец</b>"]
    Continue --> End2["🎯 <b>Конец</b>"]
    Refer --> End3["🏥 <b>Специалист</b>"]
    
    style Start fill:#e8f4f8,stroke:#0891b2,stroke-width:3px
    style Treatment fill:#dbeafe,stroke:#3b82f6,stroke-width:2px
    style Decision1 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style Decision2 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style Decision3 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style Continue fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style Refer fill:#f3e8ff,stroke:#a855f7,stroke-width:2px
`;

// ============================================
// 6. МУЛЬТИЯЗЫЧНОСТЬ
// ============================================

/**
 * lib/i18n/config.ts
 */

export const defaultLocale = 'ru';
export const locales = ['ru', 'kk', 'en'] as const;

export const translations = {
  ru: {
    questionnaire: {
      title: 'Опросник ICIQ-SF',
      description: 'Оценка тяжести недержания мочи',
      question1: 'Как часто у вас бывает непроизвольная потеря мочи?',
      question2: 'Какое количество мочи обычно вы теряете?',
      question3: 'Насколько недержание влияет на вашу жизнь?',
      submit: 'Рассчитать результат',
      reset: 'Начать заново',
    },
  },
  kk: {
    questionnaire: {
      title: 'ICIQ-SF сауалнамасы',
      description: 'Іс-тұқымның ауырлығын бағалау',
      question1: 'Сіз қаншалықты жиі ісінің бақсы өтінігін жоғалтасыз?',
      question2: 'Әдетте сіз қанша ісінің бақсы өтінігін жоғалтасыз?',
      question3: 'Іс-тұқым өміңіздіге қаншалықты әсер етеді?',
      submit: 'Нәтижесін есептеу',
      reset: 'Қайта бастау',
    },
  },
  en: {
    questionnaire: {
      title: 'ICIQ-SF Questionnaire',
      description: 'Assess the severity of urinary incontinence',
      question1: 'How often do you experience involuntary urine loss?',
      question2: 'What amount of urine do you usually lose?',
      question3: 'How much does incontinence affect your quality of life?',
      submit: 'Calculate Results',
      reset: 'Start Over',
    },
  },
};

export type Locale = typeof locales[number];

// ============================================
// 7. ШИФРОВАНИЕ ДАННЫХ
// ============================================

/**
 * lib/utils/encryption.ts
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

export function encryptData(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string): string {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// 8. SESSION MANAGEMENT
// ============================================

/**
 * lib/utils/session.ts
 * Управление анонимными сессиями
 */

import { v4 as uuidv4 } from 'uuid';

export function generateSessionToken(): string {
  return uuidv4();
}

export function getOrCreateSession(): string {
  if (typeof window === 'undefined') return '';

  const storageKey = 'urowomen_session_token';
  let token = localStorage.getItem(storageKey);

  if (!token) {
    token = generateSessionToken();
    localStorage.setItem(storageKey, token);
  }

  return token;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('urowomen_session_token');
    localStorage.removeItem('iciq-sf-session');
  }
}

// ============================================
// 9. ТЕСТИРОВАНИЕ (JEST)
// ============================================

/**
 * __tests__/scoring.test.ts
 */

import { calculateICIQSFScore } from '@/lib/utils/scoring';

describe('ICIQ-SF Scoring', () => {
  test('should calculate score 0 for no symptoms', () => {
    const result = calculateICIQSFScore({
      frequency: 0,
      amount: 0,
      impact: 0,
    });
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('should calculate score 8 for mild symptoms', () => {
    const result = calculateICIQSFScore({
      frequency: 1,
      amount: 2,
      impact: 5,
    });
    expect(result.score).toBe(8);
    expect(result.severity).toBe('mild');
  });

  test('should calculate score 12 for moderate symptoms', () => {
    const result = calculateICIQSFScore({
      frequency: 3,
      amount: 4,
      impact: 5,
    });
    expect(result.score).toBe(12);
    expect(result.severity).toBe('moderate');
  });

  test('should calculate score 21 for severe symptoms', () => {
    const result = calculateICIQSFScore({
      frequency: 5,
      amount: 6,
      impact: 10,
    });
    expect(result.score).toBe(21);
    expect(result.severity).toBe('severe');
  });
});

// ============================================
// 10. ENV EXAMPLE
// ============================================

/*
.env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/urowomen"

# Encryption
ENCRYPTION_KEY="your-32-character-key-here-change-this"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/..."

# Email (для отправки результатов врачам)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (для кэширования сессий)
REDIS_URL="redis://localhost:6379"

# GDPR
GDPR_DATA_RETENTION_DAYS="90"
GDPR_DELETE_CRON="0 2 * * *"  # 02:00 UTC ежедневно

# Deployment
VERCEL_TOKEN="your-vercel-token"
RAILWAY_TOKEN="your-railway-token"
*/
