import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { createProblemSchema, type CreateProblemFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useApiMutation } from '@/lib/typed-mutation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Check,
  Code,
  HelpCircle,
  Plus,
  Trash2,
  FileText,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Download,
  Sparkles
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUPPORTED_LANGUAGES } from '@/assets/constants';
import { MonacoEditor } from '@/components/MonacoEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/problems/create')({
  component: CreateProblemPage,
})

// Sample problem data
const sampleDPProblem = {
  title: "Climbing Stairs",
  description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
  difficulty: "EASY" as const,
  tags: ["Dynamic Programming", "Math", "Memoization"],
  constraints: "1 <= n <= 45",
  hints: "To reach the nth step, you can either come from the (n-1)th step or the (n-2)th step.",
  editorial: "This is a classic dynamic programming problem. The number of ways to reach the nth step is the sum of the number of ways to reach the (n-1)th step and the (n-2)th step, forming a Fibonacci-like sequence.",
  examples: [
    {
      input: "n = 2",
      output: "2",
      explanation: "There are two ways to climb to the top:\n1. 1 step + 1 step\n2. 2 steps"
    }
  ],
  testCases: [
    { input: "2", output: "2" },
    { input: "3", output: "3" },
    { input: "4", output: "5" }
  ],
  codeSnippets: {
    javascript: `function climbStairs(n) {
  // Write your code here
}`,
    python: `def climbStairs(n):
    # Write your code here
    pass`,
    java: `public int climbStairs(int n) {
    // Write your code here
    return 0;
}`
  },
  referenceSolution: {
    javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let dp = new Array(n + 1);
  dp[1] = 1;
  dp[2] = 2;
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`,
    python: `def climbStairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    java: `public int climbStairs(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1;
    dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`
  }
};

const sampleStringProblem = {
  title: "Valid Palindrome",
  description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.",
  difficulty: "EASY" as const,
  tags: ["String", "Two Pointers"],
  constraints: "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
  hints: "Consider using two pointers, one from the start and one from the end, moving towards the center.",
  editorial: "We can use two pointers approach to check if the string is a palindrome. One pointer starts from the beginning and the other from the end, moving towards each other.",
  examples: [
    {
      input: 's = "A man, a plan, a canal: Panama"',
      output: "true",
      explanation: '"amanaplanacanalpanama" is a palindrome.'
    }
  ],
  testCases: [
    { input: "A man, a plan, a canal: Panama", output: "true" },
    { input: "race a car", output: "false" },
    { input: " ", output: "true" }
  ],
  codeSnippets: {
    javascript: `function isPalindrome(s) {
  // Write your code here
}`,
    python: `def isPalindrome(s):
    # Write your code here
    pass`,
    java: `public boolean isPalindrome(String s) {
    // Write your code here
    return false;
}`
  },
  referenceSolution: {
    javascript: `function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
    python: `def isPalindrome(s):
    filtered = [c.lower() for c in s if c.isalnum()]
    return filtered == filtered[::-1]`,
    java: `public boolean isPalindrome(String s) {
    s = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++;
        right--;
    }
    return true;
}`
  }
};

export function CreateProblemPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [activeReferenceLang, setActiveReferenceLang] = useState('javascript');
  const [sampleType, setSampleType] = useState('DP');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' });
      return;
    }
    if (user?.role !== 'ADMIN') {
      navigate({to: '/'});
    }
  }, [user, navigate, isAuthenticated]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<CreateProblemFormData>({
    resolver: zodResolver(createProblemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'MEDIUM',
      examples: [{ input: '', output: '', explanation: '' }],
      tags: [],
      constraints: '',
      hints: '',
      editorial: '',
      testCases: [{ input: '', output: '' }],
      codeSnippets: {
        javascript: '// Write your JavaScript solution here',
        python: '# Write your Python solution here',
        java: '// Write your Java solution here',
      },
      referenceSolution: {
        javascript: '// Reference solution for JavaScript',
        python: '# Reference solution for Python',
        java: '// Reference solution for Java',
      },
    },
    mode: 'onChange',
  });

  const {
    fields: exampleFields,
    append: appendExample,
    remove: removeExample,
  } = useFieldArray({
    control,
    name: 'examples',
  });

  const {
    fields: testCaseFields,
    append: appendTestCase,
    remove: removeTestCase,
    replace: replaceTestCases,
  } = useFieldArray({
    control,
    name: 'testCases',
  });

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({
    control,
    name: 'tags',
  });


  // Enhanced validation with real-time tag validation
  useEffect(() => {
    const subscription = watch((value) => {
      // Validate form fields
      trigger();
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const createProblemMutation = useApiMutation<any, CreateProblemFormData & { tags: string[] }>({
    mutationFn: (data) => api.post('/problems', data).then((res) => res.data),
    onSuccess: (data) => {
      toast({
        title: '✅ Problem created successfully!',
        description: `"${data.data.title}" has been added to the problem set.`,
        duration: 5000,
      });
      navigate({ to: '/problems' });
    },
    onError: (error) => {
      const apiError = error.response?.data;
      toast({
        variant: 'destructive',
        title: '❌ Failed to create problem',
        description: apiError?.message || 'Please check your input and try again.',
        duration: 5000,
      });
    },
  });

  const handleTagAdd = () => {
    const value = tagInput.trim();
    if (!value) return;

    appendTag({ value });
    setTagInput('');
  };


  const loadSampleData = () => {
    const sampleData = sampleType === 'DP' ? sampleDPProblem : sampleStringProblem;

    replaceTestCases(sampleData.testCases);

    reset({
      title: sampleData.title,
      description: sampleData.description,
      difficulty: sampleData.difficulty,
      constraints: sampleData.constraints,
      hints: sampleData.hints,
      editorial: sampleData.editorial,
      examples: sampleData.examples,
      testCases: sampleData.testCases,
      codeSnippets: sampleData.codeSnippets,
      referenceSolution: sampleData.referenceSolution,
      tags: sampleData.tags.map(tag => ({ value: tag })),
    });

    toast({
      title: '📝 Sample data loaded',
      description: `Loaded ${sampleType === 'DP' ? 'Dynamic Programming' : 'String'} problem template.`,
      duration: 3000,
    });
  };

  const onSubmit = async (data: CreateProblemFormData) => {
    if (!user || user.role !== 'ADMIN') {
      toast({
        variant: 'destructive',
        title: '🚫 Permission denied',
        description: 'Only administrators can create problems.',
        duration: 5000,
      });
      return;
    }

    const tags = data.tags.map(t => t.value);

    if (tags.length === 0) {
      toast({
        variant: 'destructive',
        title: '🏷️ Tags required',
        description: 'Please add at least one tag for the problem.',
      });
      return;
    }


    // Validate each tag
    const invalidTags = tags.filter(tag => tag.trim().length === 0);
    if (invalidTags.length > 0) {
      toast({
        variant: 'destructive',
        title: '❌ Invalid tags',
        description: 'Tags cannot be empty. Please remove or edit empty tags.',
        duration: 5000,
      });
      return;
    }

    // Validate form data
    try {
      const validationResult = createProblemSchema.safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('\n');
        toast({
          variant: 'destructive',
          title: '📋 Validation failed',
          description: errorMessages,
          duration: 7000,
        });
        return;
      }

      // Combine with tags
      const completeData = {
        ...validationResult.data,
        tags: validationResult.data.tags.map(t => t.value),
      };

      createProblemMutation.mutate(completeData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Unexpected error',
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card className="shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="w-8 h-8 text-amber-600" />
              Create Problem
            </CardTitle>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex border rounded-md">
                <Button
                  type="button"
                  variant={sampleType === 'DP' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setSampleType('DP')}
                >
                  DP Problem
                </Button>
                <Button
                  type="button"
                  variant={sampleType === 'string' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setSampleType('string')}
                >
                  String Problem
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={loadSampleData}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Load Sample
              </Button>
            </div>
          </div>
          <Separator />
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-lg font-semibold">
                  Title *
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter problem title"
                  className="mt-2 text-lg"
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <Label htmlFor="difficulty" className="text-lg font-semibold">
                  Difficulty *
                </Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}  >
                      <SelectTrigger
                        className="mt-2"
                        aria-invalid={!!errors.difficulty}
                      >
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">
                          <Badge className="bg-green-100 text-green-800">
                            Easy
                          </Badge>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <Badge className="bg-amber-100 text-amber-800">
                            Medium
                          </Badge>
                        </SelectItem>
                        <SelectItem value="HARD">
                          <Badge className="bg-red-100 text-red-800">
                            Hard
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.difficulty && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.difficulty.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label htmlFor="description" className="text-lg font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter problem description"
                  className="mt-2 min-h-36 text-base resize-y"
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>


            {/* Tags */}
            <Card className="bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    Tags *
                  </CardTitle>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tag"
                      className="w-40"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                    />
                    <Button
                      type="button cursor-pointer"
                      size={"lg"}
                      onClick={handleTagAdd}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tagFields.map((field, index) => (
                    <Badge
                      key={field.id}
                      variant="secondary"
                      className="px-3 py-1.5 bg-blue-100 text-blue-800"
                    >
                      {field.value}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}

                  {tagFields.length === 0 && (
                    <p className="text-gray-500 text-sm">No tags added yet</p>
                  )}
                </div>
                {tagFields.length === 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      At least one tag is required
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Examples */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    Examples *
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendExample({ input: '', output: '', explanation: '' })}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {exampleFields.map((field, index) => (
                  <Card key={field.id} className="bg-background">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          Example #{index + 1}
                        </CardTitle>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExample(index)}
                            className="text-red-500 gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Input *</Label>
                          <Textarea
                            {...register(`examples.${index}.input`)}
                            placeholder="Example input"
                            className="font-mono min-h-20"
                            aria-invalid={!!errors.examples?.[index]?.input}
                          />
                          {errors.examples?.[index]?.input && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.examples[index].input.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Output *</Label>
                          <Textarea
                            {...register(`examples.${index}.output`)}
                            placeholder="Expected output"
                            className="font-mono min-h-20"
                            aria-invalid={!!errors.examples?.[index]?.output}
                          />
                          {errors.examples?.[index]?.output && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.examples[index].output.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Explanation (Optional)</Label>
                        <Textarea
                          {...register(`examples.${index}.explanation`)}
                          placeholder="Explain the example"
                          className="min-h-20"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {errors.examples && !Array.isArray(errors.examples) && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {errors.examples.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Test Cases */}
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Test Cases *
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendTestCase({ input: '', output: '' })}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Test Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {testCaseFields.map((field, index) => (
                  <Card key={field.id} className="bg-background">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          Test Case #{index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCase(index)}
                          disabled={testCaseFields.length === 1}
                          className="text-red-500 gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="font-medium">Input *</Label>
                          <Textarea
                            {...register(`testCases.${index}.input`)}
                            placeholder="Enter test case input"
                            className="mt-2 min-h-24 font-mono"
                            aria-invalid={!!errors.testCases?.[index]?.input}
                          />
                          {errors.testCases?.[index]?.input && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.testCases[index].input.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="font-medium">Expected Output *</Label>
                          <Textarea
                            {...register(`testCases.${index}.output`)}
                            placeholder="Enter expected output"
                            className="mt-2 min-h-24 font-mono"
                            aria-invalid={!!errors.testCases?.[index]?.output}
                          />
                          {errors.testCases?.[index]?.output && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.testCases[index].output.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {errors.testCases && !Array.isArray(errors.testCases) && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {errors.testCases.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Code Snippets */}
            <Card className="bg-slate-50 dark:bg-slate-950/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Code className="w-5 h-5 text-slate-600" />
                  Starter Code *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="space-y-4">
                  <TabsList className="grid grid-cols-3 w-full max-w-md">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TabsTrigger key={lang.id} value={lang.id}>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <TabsContent key={lang.id} value={lang.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {lang.name} Starter Code *
                      </Label>
                      <Controller
                        name={`codeSnippets.${lang.id}`}
                        control={control}
                        render={({ field }) => (
                          <MonacoEditor
                            language={lang.monacoLang}
                            value={field.value}
                            onChange={field.onChange}
                            height="300px"
                            className="border rounded-lg overflow-hidden"
                          />
                        )}
                      />
                      {errors.codeSnippets?.[lang.id as keyof typeof errors.codeSnippets] && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            {errors.codeSnippets[lang.id as keyof typeof errors.codeSnippets]?.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Reference Solution */}
            <Card className="bg-slate-50 dark:bg-slate-950/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Reference Solution *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeReferenceLang} onValueChange={setActiveReferenceLang} className="space-y-4">
                  <TabsList className="grid grid-cols-3 w-full max-w-md">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TabsTrigger key={lang.id} value={lang.id}>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <TabsContent key={lang.id} value={lang.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {lang.name} Reference Solution *
                      </Label>
                      <Controller
                        name={`referenceSolution.${lang.id}`}
                        control={control}
                        render={({ field }) => (
                          <MonacoEditor
                            language={lang.monacoLang}
                            value={field.value}
                            onChange={field.onChange}
                            height="300px"
                            className="border rounded-lg overflow-hidden"
                          />
                        )}
                      />
                      {errors.referenceSolution?.[lang.id as keyof typeof errors.referenceSolution] && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            {errors.referenceSolution[lang.id as keyof typeof errors.referenceSolution]?.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="font-medium">Constraints *</Label>
                  <Textarea
                    {...register('constraints')}
                    placeholder="Enter problem constraints"
                    className="mt-2 min-h-24 font-mono"
                    aria-invalid={!!errors.constraints}
                  />
                  {errors.constraints && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.constraints.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-medium">Hints (Optional)</Label>
                    <Textarea
                      {...register('hints')}
                      placeholder="Enter hints for solving the problem"
                      className="mt-2 min-h-24"
                    />
                  </div>
                  <div>
                    <Label className="font-medium">Editorial (Optional)</Label>
                    <Textarea
                      {...register('editorial')}
                      placeholder="Enter problem editorial/solution explanation"
                      className="mt-2 min-h-24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Summary */}
            <Card className="sticky bottom-1 bg-background/50 backdrop-blur-sm border shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Validation Summary</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={errors.title ? "destructive" : "secondary"}
                        className={!errors.title ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.title ? '✗ Title' : '✓ Title'}
                      </Badge>
                      <Badge
                        variant={errors.description ? "destructive" : "secondary"}
                        className={!errors.description ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.description ? '✗ Description' : '✓ Description'}
                      </Badge>
                      <Badge
                        variant={errors.difficulty ? "destructive" : "secondary"}
                        className={!errors.difficulty ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.difficulty ? '✗ Difficulty' : '✓ Difficulty'}
                      </Badge>
                      <Badge
                        variant={tagFields.length === 0 ? "destructive" : "secondary"}
                        className={tagFields.length > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {tagFields.length === 0 ? '✗ Tags' : `✓ ${tagFields.length} Tags`}
                      </Badge>
                      <Badge
                        variant={errors.examples ? "destructive" : "secondary"}
                        className={!errors.examples ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.examples ? '✗ Examples' : '✓ Examples'}
                      </Badge>
                      <Badge
                        variant={errors.constraints ? "destructive" : "secondary"}
                        className={!errors.constraints ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.constraints ? '✗ Constraints' : '✓ Constraints'}
                      </Badge>
                      <Badge
                        variant={errors.testCases ? "destructive" : "secondary"}
                        className={!errors.testCases ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {errors.testCases ? '✗ Test Cases' : '✓ Test Cases'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={createProblemMutation.isPending || !isValid}
                    className={`gap-2 min-w-40 transition-all duration-200 ${isValid && tagFields.length > 0
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                      }`}
                  >
                    {createProblemMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Create Problem
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}