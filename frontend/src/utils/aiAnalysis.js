export const isValidAnalysis = (analysis) =>
  analysis &&
  typeof analysis.summary === 'string' &&
  Array.isArray(analysis.observedFacts) &&
  Array.isArray(analysis.interpretation) &&
  Array.isArray(analysis.recommendations) &&
  ('bottleneck' in analysis)
