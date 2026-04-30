export function verifyAnswer(answer: string): string {
  if (!answer || answer.length < 5) {
    return 'Something went wrong. Please try again.';
  }

  return answer;
}
