import { TaskDetector } from '../task-detector';

describe('TaskDetector', () => {
  let detector: TaskDetector;

  beforeEach(() => {
    detector = new TaskDetector();
  });

  describe('English inputs', () => {
    it('detects imperative tasks', () => {
      const result = detector.detect('Create a REST API with FastAPI');
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('classifies questions as non-tasks', () => {
      const result = detector.detect('What is TypeScript?');
      expect(result.isTask).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('does not treat "How does Docker work?" as a task', () => {
      const result = detector.detect('How does Docker work?');
      expect(result.isTask).toBe(false);
    });
  });

  describe('German inputs', () => {
    it('detects German imperative tasks', () => {
      const result = detector.detect('Erstelle eine React Komponente');
      expect(result.isTask).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('detects "Baue mir ..." tasks', () => {
      const result = detector.detect('Baue mir einen Webshop mit React und Postgres');
      expect(result.isTask).toBe(true);
    });

    it('classifies German questions as non-tasks', () => {
      const result = detector.detect('Was ist eine App?');
      expect(result.isTask).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('classifies "Wie funktioniert Docker?" as a question', () => {
      const result = detector.detect('Wie funktioniert Docker?');
      expect(result.isTask).toBe(false);
    });
  });

  describe('complexity', () => {
    it('rates multi-tech tasks as complex', () => {
      const result = detector.detect(
        'Baue mir einen Webshop mit React, Postgres und Docker Deployment'
      );
      expect(result.complexity).toBe('complex');
    });

    it('rates short single-tech tasks as simple', () => {
      const result = detector.detect('Erstelle eine React Komponente');
      expect(result.complexity).toBe('simple');
    });
  });

  describe('agent suggestions', () => {
    it('suggests frontend for React tasks', () => {
      const result = detector.detect('Create a React component');
      expect(result.suggestedAgents).toContain('frontend');
    });

    it('suggests devops for Docker tasks', () => {
      const result = detector.detect('Setup docker deployment pipeline');
      expect(result.suggestedAgents).toContain('devops');
    });
  });

  it('confidence is always within [0, 1]', () => {
    const inputs = [
      'Was?',
      'Create create create build make react docker api component test.ts with using',
      '',
      'x'
    ];
    for (const input of inputs) {
      const c = detector.detect(input).confidence;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});
