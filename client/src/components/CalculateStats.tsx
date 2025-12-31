import type { ProfileResponse } from "@/types/types";

export function calculateStats(data: ProfileResponse) {
    const submissions = data.data.user.submissions || [];
    const problems = data.data.user.problems || [];
    const playlists = data.data.user.playlists || [];

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.status === "ACCEPTED").length;
    const successRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    // Get unique solved problem IDs
    const solvedProblemIds = new Set(
        submissions
            .filter(s => s.status === "ACCEPTED")
            .map(s => s.problemId)
    );
    const totalProblemsSolved = solvedProblemIds.size;

    // Count by difficulty
    const difficultyCount = problems.reduce((acc, problem) => {
        if (solvedProblemIds.has(problem.id)) {
            acc[problem.difficulty] = (acc[problem.difficulty] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // Prepare calendar data
    const submissionCalendar: Record<string, number> = {};
    submissions.forEach(submission => {
        const date = new Date(submission.createdAt).toISOString().split('T')[0];
        submissionCalendar[date] = (submissionCalendar[date] || 0) + 1;
    });

    // Get recent submissions (last 10)
    const recentSubmissions = [...submissions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

    return {
        totalSubmissions,
        acceptedSubmissions,
        successRate,
        totalProblemsSolved,
        playlistsCreated: playlists.length,
        problemsCreated: problems.length,
        difficultyCount,
        submissionCalendar,
        recentSubmissions,
        allSubmissions: submissions
    };
}