/**
 * Categorias canônicas de saúde. Devem espelhar os `label` de HEALTH_TOPICS
 * em `gnews.ts` (usados na ingestão). Centralizadas aqui para reuso no painel
 * de moderação sem arrastar código de servidor (fetch/env) para o cliente.
 */
export const CATEGORY_OPTIONS = [
  "Saúde",
  "Bem-estar",
  "Alimentação",
  "Exercícios",
  "Tecnologia",
] as const;

export type Category = (typeof CATEGORY_OPTIONS)[number];
