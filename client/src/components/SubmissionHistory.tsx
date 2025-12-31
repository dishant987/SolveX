import type { ProfileResponse } from "@/types/types";
import type { calculateStats } from "./CalculateStats";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";

export function SubmissionHistory({ submissions, problems }: {
    submissions: ReturnType<typeof calculateStats>['recentSubmissions'],
    problems: ProfileResponse['data']['user']['problems']
}) {
    const getProblemTitle = (problemId: string) => {
        const problem = problems.find(p => p.id === problemId);
        return problem?.title || "Unknown Problem";
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACCEPTED": return "text-green-600 dark:text-green-400";
            case "WRONG_ANSWER": return "text-red-600 dark:text-red-400";
            case "TIME_LIMIT_EXCEEDED": return "text-orange-600 dark:text-orange-400";
            case "RUNTIME_ERROR": return "text-red-600 dark:text-red-400";
            case "COMPILE_ERROR": return "text-yellow-600 dark:text-yellow-400";
            default: return "text-muted-foreground";
        }
    };

    const formatTime = (time: string | null) => {
        if (!time) return "N/A";
        return `${parseFloat(time).toFixed(2)}s`;
    };

    const formatMemory = (memory: string | null) => {
        if (!memory) return "N/A";
        const mb = parseFloat(memory);
        return `${mb.toFixed(2)} MB`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Submissions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No submissions yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="pb-3">Problem</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Language</th>
                                        <th className="pb-3">Time</th>
                                        <th className="pb-3">Memory</th>
                                        <th className="pb-3">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} className="border-b last:border-0">
                                            <td className="py-3">
                                                <div className="font-medium">
                                                    {getProblemTitle(submission.problemId)}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className={`flex items-center gap-2 font-medium ${getStatusColor(submission.status)}`}>
                                                    {submission.status === "ACCEPTED" && (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                    {submission.status.replace(/_/g, ' ')}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <Badge variant="outline">
                                                    {submission.language.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-sm">
                                                {formatTime(submission.time)}
                                            </td>
                                            <td className="py-3 text-sm">
                                                {formatMemory(submission.memory)}
                                            </td>
                                            <td className="py-3 text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}