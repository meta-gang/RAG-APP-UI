// 임시 데이터(Mock Data)를 별도 파일로 분리하여 관리

import { EvaluationRun } from '../globals/types';

/*
처음부터 모듈이 없다가 나중에 추가된 경우,
RAG Evaluation Platform의 그래프에 해당 모듈의 성능 그래프가 나오지 않음
*/

export const evaluationRuns: EvaluationRun[] = [
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
              { name: "Metric1", score: 0.91 },
              { name: "Metric2", score: 0.9 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Metric1", score: 0.85 },
              { name: "Metric2", score: 0.88 },
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
              { name: "Metric2", score: 0.95 },
              { name: "Metric3", score: 0.96 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Metric2", score: 0.92 },
              { name: "Metric3", score: 0.94 },
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
              { name: "Metric1", score: 0.72 },
              { name: "Metric2", score: 0.84 },
              { name: "Metric3", score: 0.93 },
              { name: "Metric4", score: 0.92 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Metric1", score: 0.79 },
              { name: "Metric2", score: 0.86 },
              { name: "Metric3", score: 0.88 },
              { name: "Metric4", score: 0.94 },
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
            metrics: [{ name: "Metric1", score: 0.78 }],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [{ name: "Metric1", score: 0.85 }],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [{ name: "Metric1", score: 0.72 }],
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
              { name: "Metric2", score: 0.96 },
              { name: "Metric3", score: 0.97 },
            ],
          },
          {
            query: "Q2",
            answer: "A2",
            metrics: [
              { name: "Metric2", score: 0.94 },
              { name: "Metric3", score: 0.95 },
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
              { name: "Metric3", score: 0.95 },
              { name: "Metric4", score: 0.94 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Metric3", score: 0.82 },
              { name: "Metric4", score: 0.91 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Metric3", score: 0.75 },
              { name: "Metric4", score: 0.88 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Metric3", score: 0.98 },
              { name: "Metric4", score: 0.95 },
            ],
          },
          {
            query: "벡터 데이터베이스란?",
            answer: "A5",
            metrics: [
              { name: "Metric3", score: 0.89 },
              { name: "Metric4", score: 0.92 },
            ],
          },
          {
            query: "LangChain 사용법",
            answer: "A6",
            metrics: [
              { name: "Metric3", score: 0.65 },
              { name: "Metric4", score: 0.78 },
            ],
          },
        ],
      },
      /*
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [
              { name: "Metric1", score: 0.78 },
              { name: "Metric5", score: 0.71 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Metric1", score: 0.85 },
              { name: "Metric5", score: 0.75 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Metric1", score: 0.72 },
              { name: "Metric5", score: 0.68 },
            ],
          },
        ],
      },
      */
      {
        moduleName: "MyGenerationModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [
              { name: "Metric2", score: 0.98 },
              { name: "Metric3", score: 0.99 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Metric2", score: 0.95 },
              { name: "Metric3", score: 0.96 },
              { name: "Metric6", score: 0.38 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Metric2", score: 0.88 },
              { name: "Metric3", score: 0.92 },
              { name: "Metric6", score: 0.42 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Metric2", score: 0.99 },
              { name: "Metric3", score: 0.98 },
              { name: "Metric6", score: 0.44 },
            ],
          },
        ],
      },
    ],
  },
  {
    date: "08-19",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
          {
            query: "RAG란 무엇인가?",
            answer: "A1",
            metrics: [
              { name: "Metric1", score: 0.43 },
              { name: "Metric2", score: 0.55 },
              { name: "Metric3", score: 0.72 },
              { name: "Metric4", score: 0.94 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Metric1", score: 0.82 },
              { name: "Metric2", score: 0.91 },
              { name: "Metric3", score: 0.75 },
              { name: "Metric4", score: 0.93 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Metric1", score: 0.55 },
              { name: "Metric2", score: 0.68 },
              { name: "Metric3", score: 0.75 },
              { name: "Metric4", score: 0.88 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Metric1", score: 0.98 },
              { name: "Metric2", score: 0.95 },
              { name: "Metric3", score: 0.44 },
              { name: "Metric4", score: 0.99 },
            ],
          },
          {
            query: "벡터 데이터베이스란?",
            answer: "A5",
            metrics: [
              { name: "Metric1", score: 0.89 },
              { name: "Metric2", score: 0.92 },
              { name: "Metric3", score: 0.78 },
              { name: "Metric4", score: 0.88 },
            ],
          },
          {
            query: "LangChain 사용법",
            answer: "A6",
            metrics: [
              { name: "Metric1", score: 0.65 },
              { name: "Metric2", score: 0.78 },
              { name: "Metric3", score: 0.82 },
              { name: "Metric4", score: 0.90 },
            ],
          },
          {
            query: "서울의 수도는?",
            answer: "A7",
            metrics: [
              { name: "Metric1", score: 0.31 },
              { name: "Metric2", score: 0.20 },
              { name: "Metric3", score: 0.43 },
              { name: "Metric4", score: 0.55 },
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
            metrics: [
              { name: "Metric1", score: 0.78 },
              { name: "Metric5", score: 0.66 },
            ],
          },
          {
            query: "On-Premise의 장점은?",
            answer: "A2",
            metrics: [
              { name: "Metric1", score: 0.85 },
              { name: "Metric5", score: 0.77 },
            ],
          },
          {
            query: "LLM의 한계는?",
            answer: "A3",
            metrics: [
              { name: "Metric1", score: 0.72 },
              { name: "Metric5", score: 0.88 },
            ],
          },
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
          {
            query: "RAG가 뭐야?",
            answer: "A1",
            metrics: [
              { name: "Metric2", score: 0.77 },
              { name: "Metric3", score: 0.88 },
            ],
          },
          {
            query: "On-Premise의 장단점은?",
            answer: "A2",
            metrics: [
              { name: "Metric2", score: 0.82 },
              { name: "Metric3", score: 0.90 },
            ],
          },
          {
            query: "LLM의 한계가 뭐야?",
            answer: "A3",
            metrics: [
              { name: "Metric2", score: 0.90 },
              { name: "Metric3", score: 0.72 },
            ],
          },
          {
            query: "Fine-tuning이란?",
            answer: "A4",
            metrics: [
              { name: "Metric2", score: 0.96 },
              { name: "Metric3", score: 0.85 },
            ],
          },
        ],
      },
    ],
  },
  {
    date: "08-26",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "09-02",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "09-09",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "09-16",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "09-23",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "09-30",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "10-07",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "10-16",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
  {
    date: "10-23",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "10-30",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "11-06",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "11-13",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "11-20",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "11-27",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "12-04",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "12-11",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "12-18",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "12-25",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "01-02",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "01-09",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },{
    date: "01-16",
    modules: [
      {
        moduleName: "MyRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyPostRetrievalModule",
        queries: [
        ],
      },
      {
        moduleName: "MyGenerationModule",
        queries: [
        ],
      },
    ],
  },
];

export const existingQueries = [
    "What is RAG?",
    "Explain LLM evaluation.",
    "How does meta-gang work?",
    "Show dashboard stats."
];