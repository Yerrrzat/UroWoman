/**
 * components/DiagnosticAlgorithmFlow.tsx
 * Интерактивная блок-схема алгоритма диагностики недержания мочи
 * Использует React Flow для drag-and-drop и интерактивности
 */

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface DiagnosticStep {
  id: string;
  label: string;
  description: string;
  emoji: string;
  type: 'start' | 'decision' | 'process' | 'end' | 'external';
}

// Определение узлов алгоритма
const diagnosticSteps: DiagnosticStep[] = [
  {
    id: 'start',
    label: 'Пациентка приходит\nс жалобами',
    description: 'Первичный прием',
    emoji: '👩',
    type: 'start',
  },
  {
    id: 'iciq-sf',
    label: 'Заполнить ICIQ-SF',
    description: 'Оценка симптомов',
    emoji: '📋',
    type: 'process',
  },
  {
    id: 'has-symptoms',
    label: 'Есть ли\nсимптомы?',
    description: 'Анализ результатов',
    emoji: '❓',
    type: 'decision',
  },
  {
    id: 'no-symptoms',
    label: 'Наблюдение\n(повтор через год)',
    description: 'Профилактика',
    emoji: '✅',
    type: 'end',
  },
  {
    id: 'physical-exam',
    label: 'Физический осмотр\n+ Кашлевая проба',
    description: 'Клиническое обследование',
    emoji: '🔍',
    type: 'process',
  },
  {
    id: 'diary',
    label: 'Дневник мочеиспускания\n(3 дня)',
    description: 'Запись симптомов',
    emoji: '📊',
    type: 'process',
  },
  {
    id: 'urine-test',
    label: 'Анализ мочи\n+ УЗИ остаточной мочи',
    description: 'Лабораторное обследование',
    emoji: '🧪',
    type: 'process',
  },
  {
    id: 'type-defined',
    label: 'Определен\nтип недержания?',
    description: 'Классификация',
    emoji: '📌',
    type: 'decision',
  },
  {
    id: 'stress-incontinence',
    label: 'Стрессовое\nнедержание',
    description: 'Подтекание при нагрузке',
    emoji: '💪',
    type: 'process',
  },
  {
    id: 'urgency-incontinence',
    label: 'Ургентное\nнедержание',
    description: 'Подтекание при позывах',
    emoji: '⚠️',
    type: 'process',
  },
  {
    id: 'mixed-incontinence',
    label: 'Смешанное\nнедержание',
    description: 'Комбинированные симптомы',
    emoji: '🔄',
    type: 'process',
  },
  {
    id: 'conservative-treatment',
    label: 'Консервативное\nлечение',
    description: 'Упражнения, обучение, ЛОС',
    emoji: '💊',
    type: 'process',
  },
  {
    id: 'control-3mo',
    label: 'Контроль\nчерез 3 месяца',
    description: 'Повторная оценка',
    emoji: '⏱️',
    type: 'process',
  },
  {
    id: 'effect-check',
    label: 'Есть\nэффект?',
    description: 'Анализ результатов',
    emoji: '✨',
    type: 'decision',
  },
  {
    id: 'continue-treatment',
    label: 'Продолжить\nлечение',
    description: 'Поддерживающая терапия',
    emoji: '✅',
    type: 'end',
  },
  {
    id: 'refer-specialist',
    label: 'Направление\nк урогинекологу',
    description: 'Специализированная помощь',
    emoji: '🏥',
    type: 'external',
  },
];

// Стили для разных типов узлов
const getNodeStyle = (type: DiagnosticStep['type']) => {
  const baseStyle = {
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '12px',
    textAlign: 'center' as const,
    minWidth: '100px',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '2px solid',
  };

  const styles = {
    start: { ...baseStyle, backgroundColor: '#e8f4f8', borderColor: '#0891b2' },
    process: { ...baseStyle, backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
    decision: { ...baseStyle, backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
    end: { ...baseStyle, backgroundColor: '#dcfce7', borderColor: '#16a34a' },
    external: { ...baseStyle, backgroundColor: '#f3e8ff', borderColor: '#a855f7' },
  };

  return styles[type];
};

// Компонент узла
const DiagnosticNode: React.FC<{ data: DiagnosticStep }> = ({ data }) => (
  <div
    style={getNodeStyle(data.type)}
    role="article"
    aria-label={`${data.label}: ${data.description}`}
  >
    <div style={{ fontSize: '20px' }}>{data.emoji}</div>
    <div>{data.label}</div>
    <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
      {data.description}
    </div>
  </div>
);

export const DiagnosticAlgorithmFlow: React.FC = () => {
  // Создание узлов
  const initialNodes: Node[] = useMemo(() => {
    return diagnosticSteps.map((step, index) => ({
      id: step.id,
      data: { ...step },
      position: calculatePosition(step.id, index),
      type: 'default',
    }));
  }, []);

  // Создание ребер (связей)
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [
      // Основной поток
      { from: 'start', to: 'iciq-sf' },
      { from: 'iciq-sf', to: 'has-symptoms' },
      { from: 'has-symptoms', to: 'no-symptoms', label: 'Нет' },
      { from: 'has-symptoms', to: 'physical-exam', label: 'Да' },
      { from: 'physical-exam', to: 'diary' },
      { from: 'diary', to: 'urine-test' },
      { from: 'urine-test', to: 'type-defined' },
      
      // Типы недержания
      { from: 'type-defined', to: 'stress-incontinence', label: 'Стрессовое' },
      { from: 'type-defined', to: 'urgency-incontinence', label: 'Ургентное' },
      { from: 'type-defined', to: 'mixed-incontinence', label: 'Смешанное' },
      
      // Все к консервативному лечению
      { from: 'stress-incontinence', to: 'conservative-treatment' },
      { from: 'urgency-incontinence', to: 'conservative-treatment' },
      { from: 'mixed-incontinence', to: 'conservative-treatment' },
      
      // Контроль и результаты
      { from: 'conservative-treatment', to: 'control-3mo' },
      { from: 'control-3mo', to: 'effect-check' },
      { from: 'effect-check', to: 'continue-treatment', label: 'Да ✅' },
      { from: 'effect-check', to: 'refer-specialist', label: 'Нет ❌' },
    ];

    return edges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#666', strokeWidth: 2 },
      labelStyle: { fill: '#666', fontSize: 12, fontWeight: 'bold' },
    }));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div
      className="w-full h-full bg-gray-50 rounded-lg overflow-hidden"
      role="main"
      aria-label="Интерактивный алгоритм диагностики недержания мочи"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      {/* Легенда */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg text-xs">
        <h3 className="font-bold mb-2">Легенда:</h3>
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-cyan-100 border border-cyan-500" />
            <span>Старт</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-500" />
            <span>Процесс</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-500" />
            <span>Решение</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-500" />
            <span>Конец</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-500" />
            <span>Направление</span>
          </div>
        </div>
      </div>

      {/* Информационный блок */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg text-xs max-w-xs">
        <h3 className="font-bold mb-2">Совет:</h3>
        <p className="text-gray-600">
          Диаграмма показывает типичный алгоритм обследования пациентки с симптомами
          недержания мочи. Используйте для обучения и планирования лечения.
        </p>
      </div>
    </div>
  );
};

/**
 * Расчет позиции узла на основе его ID
 * (простая сетка для удобства просмотра)
 */
function calculatePosition(
  nodeId: string,
  index: number
): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    start: { x: 0, y: 0 },
    'iciq-sf': { x: 0, y: 100 },
    'has-symptoms': { x: 0, y: 200 },
    'no-symptoms': { x: -200, y: 300 },
    'physical-exam': { x: 0, y: 300 },
    diary: { x: 0, y: 400 },
    'urine-test': { x: 0, y: 500 },
    'type-defined': { x: 0, y: 600 },
    'stress-incontinence': { x: -200, y: 700 },
    'urgency-incontinence': { x: 0, y: 700 },
    'mixed-incontinence': { x: 200, y: 700 },
    'conservative-treatment': { x: 0, y: 800 },
    'control-3mo': { x: 0, y: 900 },
    'effect-check': { x: 0, y: 1000 },
    'continue-treatment': { x: -200, y: 1100 },
    'refer-specialist': { x: 200, y: 1100 },
  };

  return positions[nodeId] || { x: 0, y: index * 150 };
}

export default DiagnosticAlgorithmFlow;
