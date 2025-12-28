import axios from "axios";

const Judge0APIUrl = process.env.JUDGE0_API_URL || "http://localhost:2358";

export class Judge0Service {
  async batchSubmit(submissions: any[]) {
    return Promise.all(
      submissions.map(async (submission) => {
        const res = await axios.post(
          `${Judge0APIUrl}/submissions?base64_encoded=false&wait=false`,
          submission,
          { headers: { "Content-Type": "application/json" } }
        );
        return res.data;
      })
    );
  }

  async pollBatchResults(tokens: string[], maxAttempts = 15) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const res = await axios.get(
        `${Judge0APIUrl}/submissions/batch?tokens=${tokens.join(
          ","
        )}&base64_encoded=false`
      );

      const submissions = res.data.submissions;

      const done = submissions.every(
        (s: any) => s.status.id !== 1 && s.status.id !== 2
      );

      if (done) return submissions;

      attempts++;
      await new Promise((r) => setTimeout(r, 1500));
    }

    throw new Error("Judge0 timeout: submissions did not finish in time");
  }
}
