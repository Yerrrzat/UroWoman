/**
 * components/ICIQSFQuestionnaire.tsx
 * React компонент для ICIQ-SF с автоматическим подсчетом баллов
 * WCAG AAA compliant
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import jsPDF from 'jspdf';

interface ICIQSFAnswers {
  frequency: number | null;
  amount: number | null;
  impact: number | null;
}

interface QuestionnaireResult {
  score: number;
  severity: 'mild' | 'moderate' | 'severe';
  recommendation: string;
  timestamp: Date;
}

export const ICIQSFQuestionnaire: React.FC = () => {
  const [answers, setAnswers] = useState<ICIQSFAnswers>({
    frequency: null,
    amount: null,
    impact: null,
  });

  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Шкала ICIQ-SF: максимум 21 балл
  const frequencyOptions = [
    { value: 0, label: 'Никогда' },
    { value: 1, label: 'Примерно раз в неделю или реже' },
    { value: 2, label: 'Два или три раза в неделю' },
    { value: 3, label: 'Примерно раз в день' },
    { value: 4, label: 'Несколько раз в день' },
    { value: 5, label: 'Постоянно' },
  ];

  const amountOptions = [
    { value: 0, label: 'Нет потери' },
    { value: 2, label: 'Небольшое количество' },
    { value: 4, label: 'Умеренное количество' },
    { value: 6, label: 'Большое количество' },
  ];

  const calculateScore = (): QuestionnaireResult | null => {
    if (answers.frequency === null || answers.amount === null || answers.impact === null) {
      return null;
    }

    const score = (answers.frequency + answers.amount + answers.impact);
    
    let severity: 'mild' | 'moderate' | 'severe' = 'mild';
    let recommendation = '';

    if (score === 0) {
      severity = 'mild';
      recommendation = 'Симптомы недержания отсутствуют. Рекомендуется профилактический контроль 1 раз в год.';
    } else if (score <= 5) {
      severity = 'mild';
      recommendation = 'Легкое недержание мочи. Рекомендуется начать с тренировки мышц тазового дна (упражнения Кегеля) и коррекции образа жизни.';
    } else if (score <= 12) {
      severity = 'moderate';
      recommendation = 'Среднетяжелое недержание мочи. Требуется консультация врача для выбора комплексного лечения (тренировка + возможно медикаментозная терапия).';
    } else {
      severity = 'severe';
      recommendation = 'Тяжелое недержание мочи с значительным влиянием на качество жизни. Необходима срочная консультация урогинеколога или уролога.';
    }

    return {
      score,
      severity,
      recommendation,
      timestamp: new Date(),
    };
  };

  const handleFrequencyChange = (value: number) => {
    setAnswers({ ...answers, frequency: value });
  };

  const handleAmountChange = (value: number) => {
    setAnswers({ ...answers, amount: value });
  };

  const handleImpactChange = (value: number) => {
    setAnswers({ ...answers, impact: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedResult = calculateScore();
    if (calculatedResult) {
      setResult(calculatedResult);
      setSubmitted(true);
      // Сохраняем в localStorage для анонимной сессии
      saveToLocalStorage(calculatedResult);
    }
  };

  const saveToLocalStorage = (result: QuestionnaireResult) => {
    const sessionData = {
      questionnaire: 'ICIQ-SF',
      answers,
      result,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('iciq-sf-session', JSON.stringify(sessionData));
  };

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Заголовок
    doc.setFontSize(18);
    doc.text('Результаты опросника ICIQ-SF', margin, yPosition);
    yPosition += 15;

    // Информация о дате
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Дата: ${result.timestamp.toLocaleDateString('ru-RU')} ${result.timestamp.toLocaleTimeString('ru-RU')}`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Результат
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Общий балл: ${result.score} из 21`, margin, yPosition);
    yPosition += 10;

    // Тяжесть
    const severityMap = {
      mild: 'Легкое',
      moderate: 'Среднетяжелое',
      severe: 'Тяжелое',
    };

    doc.setFontSize(12);
    doc.text(`Тяжесть: ${severityMap[result.severity]}`, margin, yPosition);
    yPosition += 10;

    // Ответы
    doc.setFontSize(11);
    doc.text('Ответы на вопросы:', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const frequencyLabel = frequencyOptions.find(o => o.value === answers.frequency)?.label || '';
    doc.text(`• Частота подтекания: ${frequencyLabel}`, margin + 5, yPosition);
    yPosition += 6;

    const amountLabel = amountOptions.find(o => o.value === answers.amount)?.label || '';
    doc.text(`• Объем подтекания: ${amountLabel}`, margin + 5, yPosition);
    yPosition += 6;

    doc.text(`• Влияние на жизнь (0-10): ${answers.impact}`, margin + 5, yPosition);
    yPosition += 10;

    // Рекомендация
    doc.setFontSize(11);
    doc.text('Рекомендация:', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(result.recommendation, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPosition);
    yPosition += 15;

    // Дисклеймер
    doc.setFontSize(9);
    doc.setTextColor(200, 0, 0);
    const disclaimer = doc.splitTextToSize(
      'ВАЖНО: Результаты этого опросника являются информационными и не заменяют консультацию врача. Пожалуйста, обратитесь к специалисту для точной диагностики.',
      pageWidth - 2 * margin
    );
    doc.text(disclaimer, margin, yPosition);

    // Сохраняем PDF
    doc.save(`ICIQ-SF_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleReset = () => {
    setAnswers({ frequency: null, amount: null, impact: null });
    setResult(null);
    setSubmitted(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4" role="main" aria-label="ICIQ-SF опросник">
      <Card>
        <CardHeader>
          <CardTitle>Опросник ICIQ-SF</CardTitle>
          <CardDescription>
            Оценка тяжести недержания мочи и его влияния на качество жизни
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Дисклеймер */}
          <Alert className="mb-6" role="alert" aria-live="polite">
            <AlertDescription>
              Это демонстрационная форма. Результаты являются информационными и не заменяют консультацию врача.
              Данные не отправляются на сервер и хранятся только в вашем браузере.
            </AlertDescription>
          </Alert>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Вопрос 1: Частота */}
              <div className="space-y-4">
                <Label htmlFor="frequency-group" className="text-base font-semibold">
                  1. Как часто у вас бывает непроизвольная потеря мочи? *
                </Label>
                <RadioGroup
                  value={answers.frequency?.toString() || ''}
                  onValueChange={(value) => handleFrequencyChange(parseInt(value))}
                  id="frequency-group"
                  aria-required="true"
                >
                  {frequencyOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`freq-${option.value}`}
                        aria-label={option.label}
                      />
                      <Label
                        htmlFor={`freq-${option.value}`}
                        className="font-normal cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Вопрос 2: Объем */}
              <div className="space-y-4">
                <Label htmlFor="amount-group" className="text-base font-semibold">
                  2. Какое количество мочи обычно вы теряете? *
                </Label>
                <RadioGroup
                  value={answers.amount?.toString() || ''}
                  onValueChange={(value) => handleAmountChange(parseInt(value))}
                  id="amount-group"
                  aria-required="true"
                >
                  {amountOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`amount-${option.value}`}
                        aria-label={option.label}
                      />
                      <Label
                        htmlFor={`amount-${option.value}`}
                        className="font-normal cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Вопрос 3: Влияние на жизнь */}
              <div className="space-y-4">
                <Label htmlFor="impact-slider" className="text-base font-semibold">
                  3. Насколько недержание влияет на вашу жизнь? *
                </Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0 — совсем не влияет</span>
                    <span>10 — очень сильно влияет</span>
                  </div>
                  <Slider
                    id="impact-slider"
                    min={0}
                    max={10}
                    step={1}
                    value={[answers.impact || 0]}
                    onValueChange={(value) => handleImpactChange(value[0])}
                    className="w-full"
                    aria-label="Влияние на жизнь (0-10)"
                    aria-valuenow={answers.impact || 0}
                    aria-valuemin={0}
                    aria-valuemax={10}
                  />
                  <div className="text-center text-lg font-semibold text-blue-600">
                    {answers.impact !== null ? answers.impact : '—'}
                  </div>
                </div>
              </div>

              {/* Кнопка отправки */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={answers.frequency === null || answers.amount === null || answers.impact === null}
                  aria-label="Рассчитать результат"
                >
                  Рассчитать результат
                </Button>
              </div>
            </form>
          ) : result ? (
            <div className="space-y-6">
              {/* Результат */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-bold mb-4">Ваш результат</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Общий балл:</span>
                    <span className="ml-2 text-2xl font-bold text-blue-600">{result.score}/21</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Тяжесть:</span>
                    <span className={`ml-2 font-semibold px-3 py-1 rounded-full ${
                      result.severity === 'mild' ? 'bg-green-100 text-green-800' :
                      result.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.severity === 'mild' ? 'Легкое' :
                       result.severity === 'moderate' ? 'Среднетяжелое' :
                       'Тяжелое'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Рекомендация */}
              <Alert>
                <AlertDescription className="text-base">
                  <strong>Рекомендация:</strong> {result.recommendation}
                </AlertDescription>
              </Alert>

              {/* Кнопки действия */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={generatePDF}
                  variant="outline"
                  className="flex-1 min-w-[150px]"
                  aria-label="Скачать результаты в PDF"
                >
                  📥 Скачать PDF
                </Button>
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  className="flex-1 min-w-[150px]"
                  aria-label="Пройти опросник заново"
                >
                  🔄 Начать заново
                </Button>
              </div>

              {/* Совет врача */}
              <Alert>
                <AlertDescription>
                  Сохраните результаты и покажите их врачу при консультации. Это поможет специалисту быстрее оценить вашу ситуацию.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default ICIQSFQuestionnaire;
