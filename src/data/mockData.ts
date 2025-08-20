// 임시 데이터(Mock Data)를 별도 파일로 분리하여 관리

import { EvaluationRun } from '../globals/types';

const evaluationRuns: EvaluationRun[] = [
  {
    date: "07-29",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
          {
            query: "Q1",
            answer: "A1",
            metrics: [
              { name: "Context Precision", score: 0.91 },
              { name: "Context Recall", score: 0.9 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Context Precision", score: 0.85 },
              { name: "Context Recall", score: 0.88 },
            ],
          },
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
          {
            query: "Q1",
            answer: "A1",
            metrics: [
              { name: "Faithfulness", score: 0.95 },
              { name: "Answer Relevancy", score: 0.96 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Faithfulness", score: 0.92 },
              { name: "Answer Relevancy", score: 0.94 },
            ],
          },
        ],
      },
    ],
  },
  {
    date: "08-05",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
          {
            query: "Q1",
            answer: "A1",
            metrics: [
              { name: "Context Precision", score: 0.93 },
              { name: "Context Recall", score: 0.92 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Context Precision", score: 0.88 },
              { name: "Context Recall", score: 0.9 },
            ],
          },
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
          {
            query: "Q1",
            answer: "A1",
            metrics: [
              { name: "Faithfulness", score: 0.96 },
              { name: "Answer Relevancy", score: 0.97 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Faithfulness", score: 0.94 },
              { name: "Answer Relevancy", score: 0.95 },
            ],
          },
        ],
      },
    ],
  },
  {
    date: "08-12",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [
              { name: "Context Precision", score: 0.95 },
              { name: "Context Recall", score: 0.94 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Context Precision", score: 0.82 },
              { name: "Context Recall", score: 0.91 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Context Precision", score: 0.75 },
              { name: "Context Recall", score: 0.88 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Context Precision", score: 0.98 },
              { name: "Context Recall", score: 0.95 },
            ],
          },
          {
            query: "벡터 데이터베이스란?",
            answer: "A5",
            metrics: [
              { name: "Context Precision", score: 0.89 },
              { name: "Context Recall", score: 0.92 },
            ],
          },
          {
            query: "LangChain 사용법",
            answer: "A6",
            metrics: [
              { name: "Context Precision", score: 0.65 },
              { name: "Context Recall", score: 0.78 },
            ],
          },
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [{ name: "Diversity", score: 0.78 }],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [{ name: "Diversity", score: 0.85 }],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [{ name: "Diversity", score: 0.72 }],
          },
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [
              { name: "Faithfulness", score: 0.98 },
              { name: "Answer Relevancy", score: 0.99 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Faithfulness", score: 0.95 },
              { name: "Answer Relevancy", score: 0.96 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Faithfulness", score: 0.88 },
              { name: "Answer Relevancy", score: 0.92 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Faithfulness", score: 0.99 },
              { name: "Answer Relevancy", score: 0.98 },
            ],
          },
        ],
      },
    ],
  },
];

export const existingQueries = ["이전 LLM 생성 쿼리 1", "이전 LLM 생성 쿼리 2"];