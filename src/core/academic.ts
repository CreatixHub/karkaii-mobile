/** Small pure academic rules shared by the seed data and the screens. */

/** Letter grade for a percentage. The cut-offs are a convention for this mock; a submission's grade can be overridden. */
export function gradeFor(percent: number): string {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 35) return 'D';
  return 'F';
}

export const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

/** Marks lost when a late submission is penalised: the homework's max marks × its late-penalty %. */
export function latePenaltyMarks(maxMarks: number, penaltyPercent: number): number {
  return Math.round(((maxMarks * penaltyPercent) / 100) * 10) / 10;
}
