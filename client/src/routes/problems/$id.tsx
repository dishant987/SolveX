import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useExecuteCode, useGetProblemsSubmissions, useProblemById, useSubmitExecuteCode } from '@/lib/api/problems';
import { cn } from '@/lib/utils';
import { Editor } from '@monaco-editor/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Code, FileText, Lightbulb, Loader2, Play, Send, Trophy, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/problems/$id')({
    component: ProtectedProblemPage

})

function ProtectedProblemPage() {
    return (
        <ProtectedRoute redirectTo="/">
            <ProblemIdPage />
        </ProtectedRoute>
    );
}

interface ProblemData {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    tags: string[];
    constraints: string;
    hints?: string;
    editorial?: string;
    examples: any;
    testCases: Array<{ input: string; output: string }>;
    codeSnippets: {
        JAVASCRIPT?: string;
        PYTHON?: string;
        JAVA?: string;
    };
    user: {
        id: string;
        email: string;
    };
    createdAt: string;
    problemSolveds?: Array<{
        id: string;
        solvedAt: string;
    }>;
}

interface Submission {
    id: string;
    status: string;
    language: string;
    createdAt: string;
    executionTime?: number;
    memoryUsage?: number;
    passedTestCases?: number;
    totalTestCases?: number;
    testCaseResults?: Array<{
        passed: boolean;
        status: string;
        statusDescription: string;
        input: string;
        expectedOutput: string;
        actualOutput: string;
        error: string;
        executionTime: number;
        memory: number;
    }>;
}

// Difficulty Color Helper
const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case 'EASY':
            return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
        case 'MEDIUM':
            return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
        case 'HARD':
            return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
        default:
            return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'ACCEPTED':
            return <CheckCircle className="h-4 w-4" />;
        case 'WRONG_ANSWER':
        case 'TIME_LIMIT_EXCEEDED':
        case 'COMPILATION_ERROR':
        case 'RUNTIME_ERROR':
            return <XCircle className="h-4 w-4" />;
        default:
            return <AlertCircle className="h-4 w-4" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACCEPTED':
            return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
        case 'WRONG_ANSWER':
            return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
        case 'TIME_LIMIT_EXCEEDED':
            return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
        case 'COMPILATION_ERROR':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
        case 'RUNTIME_ERROR':
            return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800';
        default:
            return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
};

// Language Options
const LANGUAGE_OPTIONS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' }
];

// Default Code Templates
const DEFAULT_CODE_TEMPLATES = {
    JAVASCRIPT: `// Write your solution here
function solve(input) {
    // Your logic here
    return input;
}`,
    PYTHON: `# Write your solution here
def solve(input):
    # Your logic here
    return input`,
    JAVA: `// Write your solution here
public class Solution {
    public static Object solve(Object input) {
        // Your logic here
        return input;
    }
}`
};

// Skeleton Loader Component
const ProblemSkeleton = () => (
    <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <Skeleton className="h-10 w-64 mb-4" />
                <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Panel Skeleton */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                {/* Right Panel Skeleton */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[400px] w-full" />
                            <div className="flex gap-3 mt-4">
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
);

function ProblemIdPage() {
    const { id } = Route.useParams()
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { toast } = useToast();
    const { data, isLoading, error, refetch } = useProblemById(id);
    const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'java'>('javascript');
    const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.JAVASCRIPT);
    const [activeTab, setActiveTab] = useState('description');
    const [problemSolved, setProblemSolved] = useState(false);
    const executeCodeMutation = useExecuteCode(id);
    const problem = data?.data as ProblemData | undefined;
    const { data: submissionsData, isLoading: isLoadingSubmissions, refetch: refetchSubmissions } = useGetProblemsSubmissions(id);
    const submitExecuteCodeMutation = useSubmitExecuteCode(id);
    const submissions = submissionsData?.data as any[] | undefined;
    const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);

    useEffect(() => {
        if (problem) {
            // Set initial code from problem or default template
            const problemCode = problem.codeSnippets?.[selectedLanguage];
            setCode(problemCode || DEFAULT_CODE_TEMPLATES[selectedLanguage]);

            // Check if problem is solved by current user
            const solved = problem.problemSolveds && problem.problemSolveds.length > 0;
            setProblemSolved(solved);
        }
    }, [problem, selectedLanguage]);

    // useEffect(() => {
    //     const fetchSubmissionHistory = async () => {
    //         try {
    //             const history = await getAllSubmissionByCurrentUserForProblem(params.id);
    //             if (history.success) {
    //                 setSubmissionHistory(history.data);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching submission history:', error);
    //             toast.error('Failed to load submission history');
    //         }
    //     };

    //     fetchSubmissionHistory();
    // }, [params.id]);

    const handleRun = async () => {
        if (!problem) return;

        try {

            const res = await executeCodeMutation.mutateAsync({
                code,
                language: selectedLanguage,
            });

            if (res.success) {
                const allPassed = res.submission?.testCases.every(
                    (tc) => tc.passed
                );

                toast({
                    title: allPassed ? "✅ All Test Cases Passed!" : "⚠️ Some Test Cases Failed",
                    description: allPassed
                        ? `Great job! ${res.passedTestCases}/${res.totalTestCases} test cases passed.`
                        : `${res.passedTestCases}/${res.totalTestCases} test cases passed.`,
                    variant: allPassed ? "success" : "destructive",
                });
            } else {
                toast({
                    title: "❌ Execution Failed",
                    description: "Failed to execute code. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "❌ Execution Error",
                description: err.message || "Failed to execute code",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async () => {
        if (!problem) return;

        try {
            const res = await submitExecuteCodeMutation.mutateAsync({
                code,
                language: selectedLanguage,
            });

            if (res.success) {
                setLastSubmissionResult(res.data);
                toast({
                    title: res.data.passed ? "🎉 Submission Accepted!" : "❌ Submission Failed",
                    description: res.message,
                    variant: res.data.passed ? "success" : "destructive",
                    duration: res.data.passed ? 5000 : 3000,
                });

                // Refetch submissions list
                await refetchSubmissions();

                // If all test cases passed, update solved status
                if (res.data.passed) {
                    setProblemSolved(true);
                    await refetch(); // Refetch problem to get updated solved status
                }
            } else {
                toast({
                    title: "❌ Submission Error",
                    description: res.message,
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "❌ Submission Error",
                description: err.response?.data?.message || err.message || "Failed to submit code",
                variant: "destructive",
            });
        }
    };

    const handleLanguageChange = (value: string) => {
        setSelectedLanguage(value as 'javascript' | 'python' | 'java');
        const newCode = problem?.codeSnippets?.[value] || DEFAULT_CODE_TEMPLATES[value];
        setCode(newCode || '');
    };

    // Error handling
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Error Loading Problem
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>
                                {error.message === 'Problem not found'
                                    ? 'The requested problem could not be found.'
                                    : 'Failed to load problem. Please try again.'}
                            </AlertDescription>
                        </Alert>
                        <div className="flex gap-3">
                            <Button onClick={() => navigate({ to: "/problems" })} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                            <Button onClick={() => refetch()}>
                                <Loader2 className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading || !problem) {
        return <ProblemSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className=" border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/problems">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={cn('font-medium px-2 py-1', getDifficultyColor(problem.difficulty))}>
                                        {problem.difficulty}
                                    </Badge>
                                    {problemSolved && (
                                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 px-2 py-1">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Solved
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">

                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(problem.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Panel - Problem Details */}
                    <div className="space-y-6">
                        {/* Problem Description */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Problem Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                    <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                                        {problem.description}
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        {problem.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-sm">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Examples */}
                        {problem.examples && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle>Examples</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(problem.examples).map(([lang, example]: [string, any]) => (
                                        <div key={lang} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{lang}</Badge>
                                                {lang === selectedLanguage && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Current Language
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="bg-muted rounded-lg p-4 space-y-3">
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Input:</div>
                                                    <pre className="text-sm bg-background p-3 rounded">
                                                        {example.input}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Output:</div>
                                                    <pre className="text-sm bg-background p-3 rounded">
                                                        {example.output}
                                                    </pre>
                                                </div>
                                                {example.explanation && (
                                                    <div>
                                                        <div className="text-sm font-medium text-muted-foreground mb-1">Explanation:</div>
                                                        <p className="text-sm">{example.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Constraints */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle>Constraints</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted rounded-lg p-4">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {problem.constraints}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Additional Tabs */}
                        <Card>
                            <CardContent className="p-2">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="submissions" className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4" />
                                            Submissions
                                        </TabsTrigger>
                                        <TabsTrigger value="editorial" className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Editorial
                                        </TabsTrigger>
                                        <TabsTrigger value="hints" className="flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Hints
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="submissions" className="p-6">
                                        {isLoadingSubmissions ? (
                                            <div className="space-y-3">
                                                {[1, 2, 3].map((i) => (
                                                    <Skeleton key={i} className="h-16 w-full" />
                                                ))}
                                            </div>
                                        ) : submissions && submissions.length > 0 ? (
                                            <div className="space-y-3">
                                                {submissions.map((submission: any) => (
                                                    <div
                                                        key={submission.id}
                                                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <div className="font-medium flex items-center gap-2">
                                                                    <Code className="h-4 w-4" />
                                                                    {submission.language}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {new Date(submission.createdAt).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                className={cn(
                                                                    "px-3 py-1",
                                                                    getStatusColor(submission.status)
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    {getStatusIcon(submission.status)}
                                                                    {submission.status.replace('_', ' ')}
                                                                </div>
                                                            </Badge>
                                                        </div>
                                                        <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
                                                            {submission.time && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{submission.time}ms</span>
                                                                </div>
                                                            )}
                                                            {submission.memory && (
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                    </svg>
                                                                    <span>{submission.memory}KB</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {submission.testCases && submission.testCases.length > 0 && (
                                                            <div className="mt-2 text-xs text-muted-foreground">
                                                                {submission.testCases.filter((tc: any) => tc.passed).length}/{submission.testCases.length} test cases passed
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No submissions yet
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="editorial" className="p-6">
                                        <ScrollArea className="h-64">
                                            {problem.editorial ? (
                                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                                    <div className="whitespace-pre-wrap">
                                                        {problem.editorial}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    Editorial not available yet.
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="hints" className="p-6">
                                        <ScrollArea className="h-64">
                                            {problem.hints ? (
                                                <div className="space-y-4">
                                                    {problem.hints.split('\n').map((hint, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                                                        >
                                                            <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                            <div className="text-sm">{hint}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No hints available for this problem.
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Code Editor & Test Cases */}
                    <div className="space-y-6">
                        {/* Code Editor */}
                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="h-5 w-5" />
                                        Code Editor
                                    </CardTitle>
                                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGE_OPTIONS.map((lang) => (
                                                <SelectItem key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <Editor
                                        height="400px"
                                        language={selectedLanguage.toLowerCase()}
                                        value={code}
                                        onChange={(value) => setCode(value || '')}
                                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            roundedSelection: false,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            tabSize: 2,
                                            wordWrap: 'on',
                                            padding: { top: 16 },
                                            scrollbar: {
                                                vertical: 'visible',
                                                horizontal: 'visible'
                                            }
                                        }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4">
                                    <Button
                                        onClick={handleRun}
                                        disabled={executeCodeMutation.isPending || !code.trim()}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        {executeCodeMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Running...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
                                                Run Code
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitExecuteCodeMutation.isPending || executeCodeMutation.isPending || !code.trim()}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {submitExecuteCodeMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Submit Solution
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Test Cases */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Test Cases</CardTitle>
                                        <CardDescription>
                                            {lastSubmissionResult ?
                                                `Latest ${lastSubmissionResult.passed ? 'Submission' : 'Execution'} Results` :
                                                'Run your code against these test cases'
                                            }
                                        </CardDescription>
                                    </div>
                                    {lastSubmissionResult && (
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium">
                                                {lastSubmissionResult.passedTestCases}/{lastSubmissionResult.totalTestCases} Passed
                                            </div>
                                            <Badge className={cn(
                                                "px-3 py-1",
                                                getStatusColor(lastSubmissionResult.status),
                                                lastSubmissionResult.passed && "bg-green-500 hover:bg-green-600 text-white"
                                            )}>
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(lastSubmissionResult.status)}
                                                    {lastSubmissionResult.status.replace('_', ' ')}
                                                </div>
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {lastSubmissionResult ? (
                                            lastSubmissionResult.testCaseResults.map((testCaseResult: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        'border rounded-lg p-3 transition-colors',
                                                        testCaseResult.passed && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
                                                        !testCaseResult.passed && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                                                                testCaseResult.passed && "bg-green-500 text-white",
                                                                !testCaseResult.passed && "bg-red-500 text-white"
                                                            )}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                Test Case {index + 1}
                                                            </div>
                                                            <Badge
                                                                variant={testCaseResult.passed ? "default" : "destructive"}
                                                                className={cn(
                                                                    "text-xs font-medium",
                                                                    testCaseResult.passed && "bg-green-500 hover:bg-green-600 text-white",
                                                                    !testCaseResult.passed && "bg-red-500 hover:bg-red-600 text-white"
                                                                )}
                                                            >
                                                                {testCaseResult.status.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            {testCaseResult.time && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {testCaseResult.time}ms
                                                                </span>
                                                            )}
                                                            {testCaseResult.memory && (
                                                                <span>{testCaseResult.memory}KB</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Input:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto font-mono">
                                                                {testCaseResult.input}
                                                            </pre>
                                                        </div>

                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Expected Output:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto font-mono">
                                                                {testCaseResult.expectedOutput}
                                                            </pre>
                                                        </div>

                                                        <div>
                                                            <div className="text-muted-foreground mb-1 flex items-center justify-between">
                                                                <span>Your Output:</span>
                                                                {testCaseResult.passed ? (
                                                                    <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Correct
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-600 dark:text-red-400 text-xs flex items-center">
                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                        Incorrect
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <pre className={cn(
                                                                "bg-background p-2 rounded text-xs overflow-x-auto font-mono border",
                                                                testCaseResult.passed && "border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
                                                                !testCaseResult.passed && "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                                                            )}>
                                                                {testCaseResult.actualOutput || "No output"}
                                                            </pre>
                                                        </div>

                                                        {testCaseResult.stderr && (
                                                            <div>
                                                                <div className="text-muted-foreground mb-1">Error:</div>
                                                                <pre className="bg-red-50 dark:bg-red-950/30 p-2 rounded text-xs overflow-x-auto font-mono text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                                    {testCaseResult.stderr}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {testCaseResult.compileOutput && (
                                                            <div>
                                                                <div className="text-muted-foreground mb-1">Compilation Output:</div>
                                                                <pre className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-xs overflow-x-auto font-mono text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                                                    {testCaseResult.compileOutput}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            problem.testCases.map((testCase: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="border rounded-lg p-3 border-border"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                                {index + 1}
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                Test Case {index + 1}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Input:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto font-mono">
                                                                {testCase.input}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Expected Output:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto font-mono">
                                                                {testCase.output}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemIdPage;
