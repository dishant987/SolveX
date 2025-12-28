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
import { AlertCircle, Check, Code, HelpCircle, Plus, TestTube, Trash2, Sparkles, Zap, Layout, FileText, Tags, ChevronRight, Clock, Users, Shield, Brain, Lightbulb, BookOpen, Settings, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/TagInput';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUPPORTED_LANGUAGES } from '@/assets/constants';
import { MonacoEditor } from '@/components/MonacoEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/problems/create')({
  component: CreateProblemPage,
})

export function CreateProblemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [activeReferenceLang, setActiveReferenceLang] = useState('javascript');
  const [tags, setTags] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ADMIN' && !user) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProblemFormData>({
    resolver: zodResolver(createProblemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'MEDIUM',
      examples: [{ input: '', output: '', explanation: '' }],
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
  } = useFieldArray({
    control,
    name: 'testCases',
  });

  // Calculate form completion progress
  useEffect(() => {
    const subscription = watch(() => {
      const formValues = getValues();
      let completedFields = 0;
      const totalFields = 10; // Adjust based on your form structure

      try {
        // Check required fields
        if (formValues.title?.trim()) completedFields++;
        if (formValues.description?.trim()) completedFields++;
        if (formValues.difficulty) completedFields++;
        if (tags.length > 0) completedFields++;
        if (formValues.examples?.[0]?.input?.trim() && formValues.examples?.[0]?.output?.trim()) completedFields++;
        if (formValues.constraints?.trim()) completedFields++;
        if (formValues.testCases?.[0]?.input?.trim() && formValues.testCases?.[0]?.output?.trim()) completedFields++;

        // Check starter code for all languages
        const hasStarterCode = SUPPORTED_LANGUAGES.every(lang =>
          formValues.codeSnippets?.[lang.id as keyof typeof formValues.codeSnippets]?.trim()
        );
        if (hasStarterCode) completedFields++;

        // Check reference solution for all languages
        const hasReferenceSolution = SUPPORTED_LANGUAGES.every(lang =>
          formValues.referenceSolution?.[lang.id as keyof typeof formValues.referenceSolution]?.trim()
        );
        if (hasReferenceSolution) completedFields++;

        // Validate form
        const { tags: _, ...formDataWithoutTags } = formValues;
        createProblemSchema.parse(formDataWithoutTags);

        const hasTags = tags.length > 0;
        const allTagsValid = tags.every(tag => tag.trim().length > 0);

        if (hasTags && allTagsValid) completedFields++;

        setProgress((completedFields / totalFields) * 100);
        setIsFormValid(completedFields === totalFields);
      } catch {
        setProgress(0);
        setIsFormValid(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, tags, getValues]);

  const createProblemMutation = useApiMutation<any, CreateProblemFormData>({
    mutationFn: (data) => api.post('/problems', data).then((res) => res.data),
    onSuccess: (data) => {
      toast({
        title: '🎉 Problem Created Successfully!',
        description: `"${data.data.title}" has been added to the problem set.`,
        duration: 5000,
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
      });
      navigate({ to: '/problems' });
    },
    onError: (error) => {
      const apiError = error.response?.data;
      toast({
        variant: 'destructive',
        title: 'Failed to create problem',
        description: apiError?.message || 'Please check your input and try again.',
        duration: 5000,
      });
    },
  });

  const onSubmit = async (data: CreateProblemFormData) => {
    if (!user || user.role !== 'ADMIN') {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only administrators can create problems.',
        duration: 5000,
      });
      return;
    }

    if (tags.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'At least one tag is required.',
        duration: 5000,
      });
      return;
    }

    const invalidTags = tags.filter(tag => tag.trim().length === 0);
    if (invalidTags.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Tags cannot be empty.',
        duration: 5000,
      });
      return;
    }

    try {
      const { tags: _, ...formDataWithoutTags } = data;
      createProblemSchema.parse(formDataWithoutTags);

      const completeData = {
        ...data,
        tags: tags,
      };

      createProblemMutation.mutate(completeData);
    } catch (validationError) {
      if (validationError instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: validationError.message || 'Please fix all validation errors before submitting.',
          duration: 5000,
        });
      }
    }
  };

  const difficultyColor = {
    EASY: 'bg-gradient-to-r from-green-100 to-emerald-50 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border-amber-200',
    HARD: 'bg-gradient-to-r from-rose-100 to-red-50 text-rose-800 border-rose-200',
  };

  const sections = [
    { id: 'basics', name: 'Basic Info', icon: FileText, completed: false },
    { id: 'content', name: 'Problem Content', icon: BookOpen, completed: false },
    { id: 'code', name: 'Code Setup', icon: Code, completed: false },
    { id: 'testing', name: 'Test Cases', icon: TestTube, completed: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-4 md:p-6 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/50">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:opacity-10"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 dark:opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/problems' })}
              className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Problems
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-200">
                    Create New Problem
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Design a comprehensive coding challenge with modern features
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress and Status */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Completion Progress
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <section.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {section.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  <Shield className="h-3 w-3" />
                  Admin Mode
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Users className="h-3 w-3" />
                  Public
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Basic Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        <span>Problem Title</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="title"
                          placeholder="e.g., Two Sum"
                          {...register('title')}
                          className={`pl-10 ${errors.title ? 'border-red-500' : 'border-slate-300'}`}
                        />
                        <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      {errors.title && (
                        <p className="text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="difficulty" className="flex items-center gap-2">
                        <span>Difficulty</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="difficulty"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={`${errors.difficulty ? 'border-red-500' : ''}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${field.value === 'EASY' ? 'bg-green-500' :
                                  field.value === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                <SelectValue placeholder="Select difficulty" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EASY">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span>Easy</span>
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    Beginner
                                  </Badge>
                                </span>
                              </SelectItem>
                              <SelectItem value="MEDIUM">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                  <span>Medium</span>
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    Intermediate
                                  </Badge>
                                </span>
                              </SelectItem>
                              <SelectItem value="HARD">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  <span>Hard</span>
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    Expert
                                  </Badge>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.difficulty && (
                        <p className="text-sm text-red-600">{errors.difficulty.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <span>Description</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="description"
                        placeholder="Write a clear and concise problem statement..."
                        rows={6}
                        {...register('description')}
                        className={`min-h-[150px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                      />
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-slate-500">
                        <Brain className="h-3 w-3" />
                        <span>Markdown supported</span>
                      </div>
                    </div>
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      <span>Tags</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <TagInput
                      tags={tags}
                      onChange={setTags}
                      placeholder="Add tags (e.g., arrays, dynamic-programming)"
                      maxTags={8}
                    />
                    {tags.length === 0 && (
                      <p className="text-sm text-red-600">At least one tag is required</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Examples Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20">
                      <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle>Examples</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {exampleFields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {index + 1}
                                </span>
                              </div>
                              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                                Example {index + 1}
                              </h3>
                            </div>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExample(index)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`examples.${index}.input`}>Input</Label>
                              <div className="relative">
                                <Textarea
                                  id={`examples.${index}.input`}
                                  placeholder="Enter input example..."
                                  {...register(`examples.${index}.input`)}
                                  className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`examples.${index}.output`}>Output</Label>
                              <div className="relative">
                                <Textarea
                                  id={`examples.${index}.output`}
                                  placeholder="Enter expected output..."
                                  {...register(`examples.${index}.output`)}
                                  className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`examples.${index}.explanation`}>
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Explanation (Optional)
                              </div>
                            </Label>
                            <Textarea
                              id={`examples.${index}.explanation`}
                              placeholder="Explain the example in detail..."
                              {...register(`examples.${index}.explanation`)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendExample({ input: '', output: '', explanation: '' })}
                    className="w-full border-dashed hover:border-solid"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Example
                  </Button>
                </CardContent>
              </Card>

              {/* Code Snippets Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/20">
                      <Code className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle>Starter Code</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="space-y-4">
                    <TabsList className="grid grid-cols-3 w-full bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <TabsTrigger
                          key={lang.id}
                          value={lang.id}
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${lang.id === 'javascript' ? 'bg-yellow-500' :
                              lang.id === 'python' ? 'bg-blue-500' : 'bg-red-500'
                              }`} />
                            {lang.name}
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TabsContent key={lang.id} value={lang.id} className="space-y-3 mt-0">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            {lang.name} Starter Code
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {lang.monacoLang}
                          </Badge>
                        </div>
                        <Controller
                          name={`codeSnippets.${lang.id}`}
                          control={control}
                          render={({ field }) => (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                              <MonacoEditor
                                language={lang.monacoLang}
                                value={field.value}
                                onChange={field.onChange}
                                height="300px"
                                className="rounded-lg"
                              />
                            </div>
                          )}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Reference Solution Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Reference Solution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeReferenceLang} onValueChange={setActiveReferenceLang} className="space-y-4">
                    <TabsList className="grid grid-cols-3 w-full bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <TabsTrigger
                          key={lang.id}
                          value={lang.id}
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 rounded-md justify-start"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${lang.id === 'javascript' ? 'bg-yellow-500' :
                              lang.id === 'python' ? 'bg-blue-500' : 'bg-red-500'
                              }`} />
                            {lang.name}
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <TabsContent key={lang.id} value={lang.id} className="space-y-3 mt-0">
                        <div className="flex items-center justify-between">

                          <Label htmlFor={`referenceSolution.${lang.id}`} className="text-sm">
                            {lang.name} Solution
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {lang.monacoLang}
                          </Badge>
                        </div>
                        <Controller
                          name={`referenceSolution.${lang.id}`}
                          control={control}
                          render={({ field }) => (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                              <MonacoEditor
                                language={lang.monacoLang}
                                value={field.value}
                                onChange={field.onChange}
                                height="300px"
                                className="rounded-lg"
                              />
                            </div>
                          )}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Test Cases Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20">
                      <TestTube className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <CardTitle>Test Cases</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      Test cases will be validated against the reference solutions. Make sure they match exactly.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {testCaseFields.map((field, index) => (
                      <div key={field.id} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                              <TestTube className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="font-medium">Test Case {index + 1}</h3>
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`testCases.${index}.input`}>Input *</Label>
                            <Textarea
                              id={`testCases.${index}.input`}
                              placeholder="Test input..."
                              {...register(`testCases.${index}.input`)}
                              className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
                              rows={3}
                            />
                            {errors.testCases?.[index]?.input && (
                              <p className="text-sm text-red-600">{errors.testCases[index]?.input?.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`testCases.${index}.output`}>Expected Output *</Label>
                            <Textarea
                              id={`testCases.${index}.output`}
                              placeholder="Expected output..."
                              {...register(`testCases.${index}.output`)}
                              className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
                              rows={3}
                            />
                            {errors.testCases?.[index]?.output && (
                              <p className="text-sm text-red-600">{errors.testCases[index]?.output?.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendTestCase({ input: '', output: '' })}
                    className="w-full border-dashed hover:border-solid"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Additional Info Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="constraints" className="flex items-center gap-2">
                      <span>Constraints</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="constraints"
                        placeholder="Add constraints (one per line)..."
                        rows={4}
                        {...register('constraints')}
                        className={`font-mono text-sm ${errors.constraints ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.constraints && (
                      <p className="text-sm text-red-600">{errors.constraints.message}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="hints" className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Hints (Optional)
                    </Label>
                    <Textarea
                      id="hints"
                      placeholder="Provide hints to help users..."
                      rows={4}
                      {...register('hints')}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="editorial" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Editorial (Optional)
                    </Label>
                    <Textarea
                      id="editorial"
                      placeholder="Detailed solution explanation..."
                      rows={4}
                      {...register('editorial')}
                    />
                  </div>
                </CardContent>
              </Card>



              {/* Validation Card */}
              <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-6">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b">
                  <CardTitle className="text-sm">Validation Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Title', valid: !errors.title },
                      { label: 'Description', valid: !errors.description },
                      { label: 'Difficulty', valid: !errors.difficulty },
                      { label: 'Tags', valid: tags.length > 0 },
                      { label: 'Examples', valid: !errors.examples },
                      { label: 'Constraints', valid: !errors.constraints },
                      { label: 'Test Cases', valid: !errors.testCases },
                      { label: 'Starter Code', valid: !errors.codeSnippets },
                      { label: 'Reference Solution', valid: !errors.referenceSolution },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <div className={`p-1 rounded-full ${item.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {item.valid ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Status</span>
                      <Badge variant={isFormValid ? 'default' : 'destructive'}>
                        {isFormValid ? 'Ready to Submit' : 'Validation Required'}
                      </Badge>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={createProblemMutation.isPending || !isFormValid}
                      className={`w-full transition-all duration-300 ${isFormValid
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                        : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                      {createProblemMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Problem
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      All marked fields (*) are required
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}