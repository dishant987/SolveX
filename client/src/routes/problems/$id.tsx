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
import { useAuth } from '@/hooks/useAuth';
import { useProblemById } from '@/lib/api/problems';
import { cn } from '@/lib/utils';
import { Editor } from '@monaco-editor/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Code, FileText, Lightbulb, Loader2, Play, Send, Trophy, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/problems/$id')({
    component: ProblemIdPage,
})

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

// Language Options
const LANGUAGE_OPTIONS = [
    { value: 'JAVASCRIPT', label: 'JavaScript' },
    { value: 'PYTHON', label: 'Python' },
    { value: 'JAVA', label: 'Java' }
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
    const { isAuthenticated } = useAuth();
    const { data, isLoading, error, refetch } = useProblemById(id);
    const [selectedLanguage, setSelectedLanguage] = useState<'JAVASCRIPT' | 'PYTHON' | 'JAVA'>('JAVASCRIPT');
    const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.JAVASCRIPT);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
    const [executionResponse, setExecutionResponse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('description');
    const [problemSolved, setProblemSolved] = useState(false);

    const problem = data?.data as ProblemData | undefined;

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

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: '/' });
        }
    }, [])

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
            setIsRunning(true);
            const language_id = getJudge0LanguageId(selectedLanguage);

            // Prepare test cases
            const stdin = problem.testCases.map((tc: any) => tc.input);
            const expected_outputs = problem.testCases.map((tc: any) => tc.output);

            const res = await executeCode(
                code,
                language_id,
                stdin,
                expected_outputs,
                problem.id
            );

            setExecutionResponse(res);

            if (res.success) {
                toast({
                    title: 'Execution successful',
                    description: 'All test cases passed!',
                    variant: 'success',
                    duration: 5000,

                })

                // If all test cases passed, show success message
                const allPassed = res.submission?.testCases?.every(
                    (tc: any) => tc.status === 'PASSED'
                );

                if (allPassed) {
                    toast({
                        title: 'Execution successful',
                        description: 'All test cases passed!',
                        variant: 'success',
                        duration: 5000,

                    })
                }
            } else {
                toast({
                    title: 'Execution failed',
                    description: res.error,
                    variant: 'destructive',
                    duration: 5000,
                })
            }
        } catch (error: any) {
            console.error('Error executing code:', error);
            toast({
                title: 'Execution failed',
                description: error.message,
                variant: 'destructive',
                duration: 5000,
            })
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!problem) return;

        try {
            setIsSubmitting(true);
            // TODO: Implement submission logic
            await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API call
            // toast.success('Submission successful!');
            // Refresh submission history
            // const history = await getAllSubmissionByCurrentUserForProblem(params.id);
            // if (history.success) {
            //     setSubmissionHistory(history.data);
            // }
        } catch (error: any) {
            console.error('Error submitting code:', error);
            // toast.error(error.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLanguageChange = (value: string) => {
        setSelectedLanguage(value as 'JAVASCRIPT' | 'PYTHON' | 'JAVA');
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
                                        {submissionHistory.length > 0 ? (
                                            <div className="space-y-3">
                                                {submissionHistory.map((submission) => (
                                                    <div
                                                        key={submission.id}
                                                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <div className="font-medium">
                                                                    {submission.language}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {new Date(submission.createdAt).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    submission.status === 'ACCEPTED' ? 'default' : 'secondary'
                                                                }
                                                                className={cn(
                                                                    submission.status === 'ACCEPTED' &&
                                                                    'bg-green-500 hover:bg-green-600'
                                                                )}
                                                            >
                                                                {submission.status}
                                                            </Badge>
                                                        </div>
                                                        {(submission.executionTime || submission.memoryUsage) && (
                                                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                                {submission.executionTime && (
                                                                    <span>{submission.executionTime}ms</span>
                                                                )}
                                                                {submission.memoryUsage && (
                                                                    <span>{submission.memoryUsage}KB</span>
                                                                )}
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
                                        disabled={isRunning || !code.trim()}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        {isRunning ? (
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
                                        disabled={isSubmitting || !code.trim()}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {isSubmitting ? (
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
                                <CardTitle>Test Cases</CardTitle>
                                <CardDescription>
                                    Run your code against these test cases
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {problem.testCases.map((testCase: any, index: number) => {
                                            const executionResult = executionResponse?.submission?.testCases?.[index];
                                            const isPassed = executionResult?.status === 'PASSED';
                                            const isFailed = executionResult?.status === 'FAILED';

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        'border rounded-lg p-3 transition-colors',
                                                        isPassed && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
                                                        isFailed && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-medium">
                                                                Test Case {index + 1}
                                                            </div>
                                                            {executionResult && (
                                                                <Badge
                                                                    variant={isPassed ? 'default' : 'destructive'}
                                                                    className={cn(
                                                                        'text-xs',
                                                                        isPassed && 'bg-green-500 hover:bg-green-600'
                                                                    )}
                                                                >
                                                                    {executionResult.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {executionResult && (
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                {executionResult.executionTime && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {executionResult.executionTime}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Input:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                                                                {testCase.input}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground mb-1">Expected Output:</div>
                                                            <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                                                                {testCase.output}
                                                            </pre>
                                                        </div>
                                                        {executionResult?.actualOutput && (
                                                            <div>
                                                                <div className="text-muted-foreground mb-1">Your Output:</div>
                                                                <pre className={cn(
                                                                    "bg-background p-2 rounded text-xs overflow-x-auto",
                                                                    isPassed && "text-green-600 dark:text-green-400",
                                                                    isFailed && "text-red-600 dark:text-red-400"
                                                                )}>
                                                                    {executionResult.actualOutput}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
