/**
 * components/DiagnosticAlgorithmMermaid.tsx
 * Альтернативный компонент блок-схемы с использованием Mermaid.js
 * Более простой для интеграции и быстрого прототипирования
 */

import React from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  title?: string;
  description?: string;
}

export const DiagnosticAlgorithmMermaid: React.FC<MermaidDiagramProps> = ({
  title = 'Алгоритм диагностики недержания мочи',
  description = 'Пошаговая схема обследования и лечения пациентки',
}) => {
  // Инициализация Mermaid
  React.useEffect(() => {
    mermaid.contentLoaded();
  }, []);

  const mermaidDiagram = `
graph TD
    Start["👩 <b>Пациентка с жалобами</b><br/>на недержание мочи"] --> ICIQ["📋 <b>ICIQ-SF опросник</b><br/>Оценка частоты и объема"]
    
    ICIQ --> Decision1{🤔 <b>Есть ли<br/>симптомы?</b>}
    
    Decision1 -->|❌ Нет| NoSymptoms["✅ <b>Наблюдение</b><br/>Повтор через 1 год"]
    
    Decision1 -->|✅ Да| PhysicalExam["🔍 <b>Физический осмотр</b><br/>+ Кашлевая проба"]
    
    PhysicalExam --> Diary["📊 <b>Дневник мочеиспускания</b><br/>Запись за 3 дня"]
    
    Diary --> UrineTest["🧪 <b>Лабораторное обследование</b><br/>Анализ мочи + УЗИ"]
    
    UrineTest --> Decision2{📌 <b>Тип<br/>недержания?</b>}
    
    Decision2 -->|💪 Стрессовое| TypeStress["<b>Стрессовое недержание</b><br/>Подтекание при кашле,<br/>чихании, прыжках"]
    
    Decision2 -->|⚠️ Ургентное| TypeUrgency["<b>Ургентное недержание</b><br/>Подтекание при позывах,<br/>гиперактивный мочевой"]
    
    Decision2 -->|🔄 Смешанное| TypeMixed["<b>Смешанное недержание</b><br/>Комбинация симптомов<br/>стрессового и ургентного"]
    
    TypeStress --> Treatment["💊 <b>Консервативное лечение</b><br/>• Упражнения Кегеля<br/>• Тренировка мочевого пузыря<br/>• Коррекция образа жизни<br/>• При ургентном: М-холиноблокаторы"]
    
    TypeUrgency --> Treatment
    
    TypeMixed --> Treatment
    
    Treatment --> Control["⏱️ <b>Контроль через 3 месяца</b><br/>Повторная оценка эффективности"]
    
    Control --> Decision3{✨ <b>Есть<br/>эффект?</b>}
    
    Decision3 -->|✅ Хороший эффект| Continue["✅ <b>Продолжить лечение</b><br/>Поддерживающая терапия<br/>Регулярное наблюдение"]
    
    Decision3 -->|❌ Слабый эффект| Refer["🏥 <b>Направление к<br/>урогинекологу</b><br/>Хирургическое лечение или<br/>специализированная терапия"]
    
    NoSymptoms --> End1["🎯 <b>Конец маршрута</b>"]
    Continue --> End2["🎯 <b>Конец маршрута</b>"]
    Refer --> End3["🎯 <b>Специализированное<br/>отделение</b>"]
    
    style Start fill:#e8f4f8,stroke:#0891b2,stroke-width:3px,color:#000
    style ICIQ fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style PhysicalExam fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style Diary fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style UrineTest fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style TypeStress fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style TypeUrgency fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style TypeMixed fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style Treatment fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style Control fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    
    style Decision1 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#000
    style Decision2 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#000
    style Decision3 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#000
    
    style NoSymptoms fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    style Continue fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    style End1 fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    style End2 fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    
    style Refer fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#000
    style End3 fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#000
  `;

  return (
    <div
      className="w-full bg-white rounded-lg shadow-lg p-6"
      role="main"
      aria-label={title}
    >
      {/* Заголовок */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Диаграмма Mermaid */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <div className="mermaid" dangerouslySetInnerHTML={{ __html: mermaidDiagram }} />
      </div>

      {/* Легенда и пояснения */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">📋 Основные этапы</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>1. Опросник ICIQ-SF для оценки тяжести</li>
            <li>2. Физический осмотр и функциональные тесты</li>
            <li>3. Сбор дневника мочеиспускания</li>
            <li>4. Определение типа недержания</li>
            <li>5. Назначение консервативного лечения</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">⚡ Ключевые решения</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Нет симптомов → профилактическое наблюдение</li>
            <li>• Есть симптомы → полное обследование</li>
            <li>• Прошло 3 мес. → оценка эффективности</li>
            <li>• Результат слабый → направление к специалисту</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800 mb-2">✅ Консервативное лечение</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Упражнения Кегеля (тазовое дно)</li>
            <li>• Тренировка мочевого пузыря</li>
            <li>• Снижение веса и здоровый образ жизни</li>
            <li>• При ургентном: М-холиноблокаторы</li>
          </ul>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">🏥 Специализированное лечение</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Слинговые процедуры (стрессовое)</li>
            <li>• Инъекции ботулотоксина (ургентное)</li>
            <li>• Нейромодуляция (тяжелые случаи)</li>
            <li>• Полный спектр урогинекологических услуг</li>
          </ul>
        </div>
      </div>

      {/* Важно! */}
      <div className="mt-6 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
        <h3 className="font-bold text-red-800 mb-2">⚠️ Важное замечание</h3>
        <p className="text-sm text-gray-700">
          Этот алгоритм является общеобразовательным материалом и основан на
          международных рекомендациях (ICS, EAU, AUA, NICE). Точный диагноз и лечение
          должны определяться квалифицированным врачом после личной консультации.
        </p>
      </div>
    </div>
  );
};

export default DiagnosticAlgorithmMermaid;

/**
 * Альтернативный вариант — экспорт diagramCode для использования в markdown
 * Пример для документации:
 */
export const DiagnosticAlgorithmMarkdown = () => {
  const mermaidCode = `
\`\`\`mermaid
graph TD
    Start["👩 <b>Пациентка с жалобами</b><br/>на недержание мочи"] --> ICIQ["📋 <b>ICIQ-SF опросник</b><br/>Оценка частоты и объема"]
    ICIQ --> Decision1{🤔 <b>Есть ли<br/>симптомы?</b>}
    Decision1 -->|❌ Нет| NoSymptoms["✅ <b>Наблюдение</b><br/>Повтор через 1 год"]
    Decision1 -->|✅ Да| PhysicalExam["🔍 <b>Физический осмотр</b><br/>+ Кашлевая проба"]
    PhysicalExam --> Diary["📊 <b>Дневник мочеиспускания</b><br/>Запись за 3 дня"]
    Diary --> UrineTest["🧪 <b>Лабораторное обследование</b><br/>Анализ мочи + УЗИ"]
    UrineTest --> Decision2{📌 <b>Тип<br/>недержания?</b>}
    Decision2 -->|💪 Стрессовое| TypeStress["<b>Стрессовое недержание</b>"]
    Decision2 -->|⚠️ Ургентное| TypeUrgency["<b>Ургентное недержание</b>"]
    Decision2 -->|🔄 Смешанное| TypeMixed["<b>Смешанное недержание</b>"]
    TypeStress --> Treatment["💊 <b>Консервативное лечение</b>"]
    TypeUrgency --> Treatment
    TypeMixed --> Treatment
    Treatment --> Control["⏱️ <b>Контроль через 3 месяца</b>"]
    Control --> Decision3{✨ <b>Есть<br/>эффект?</b>}
    Decision3 -->|✅ Да| Continue["✅ <b>Продолжить лечение</b>"]
    Decision3 -->|❌ Нет| Refer["🏥 <b>Направление<br/>к специалисту</b>"]
\`\`\`
  `;

  return mermaidCode;
};
