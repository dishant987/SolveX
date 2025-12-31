import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/typed-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/FormField";
import { useToast } from "@/hooks/use-toast";
import type { ProfileResponse } from "@/types/types";
import { useAuth } from "@/hooks/useAuth";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { publicApi } from "@/lib/public-api";
import {
  LogOut,
  Camera,
  Upload,
  Calendar,
  CheckCircle,
  Clock,
  BarChart3,
  PlayCircle,
  FileText,
  Trophy,
  TrendingUp,
  CalendarDays
} from "lucide-react";
import { LogoutDialog } from "@/components/LogoutDialog";
import { useApiMutation } from "@/lib/typed-mutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

// Helper function to calculate statistics
function calculateStats(data: ProfileResponse) {
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

// Calendar component
function SubmissionCalendar({ calendarData }: { calendarData: Record<string, number> }) {

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.keys(calendarData).forEach(dateStr => {
      const year = new Date(dateStr).getFullYear();
      years.add(year);
    });
    // Add current year if not present
    const currentYear = new Date().getFullYear();
    years.add(currentYear);

    // Return sorted years in descending order
    return Array.from(years).sort((a, b) => b - a);
  }, [calendarData]);

  // Filter calendar data for selected year
  const filteredCalendarData = useMemo(() => {
    const result: Record<string, number> = {};
    Object.entries(calendarData).forEach(([dateStr, count]) => {
      const year = new Date(dateStr).getFullYear();
      if (year === selectedYear) {
        result[dateStr] = count;
      }
    });
    return result;
  }, [calendarData, selectedYear]);

  // Update months calculation to use filtered data and selected year
  const months = useMemo(() => {
    const result: Array<{
      month: string;
      year: number;
      weeks: Array<Array<{ date: Date; count: number } | null>>;
    }> = [];

    const now = new Date();
    const currentYear = selectedYear; // Use selected year instead of current year
    const currentMonth = now.getMonth();

    // Get last 12 months (including current month)
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;

      // Skip if year doesn't match selected year
      if (year !== selectedYear) continue;

      const date = new Date(year, monthIndex, 1);

      // Skip future months
      if (date > now) continue;

      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      const weeks: Array<Array<{ date: Date; count: number } | null>> = [[]];
      let currentWeek = weeks[0];

      // Calculate the day of week (0 = Sunday, 1 = Monday, etc.)
      // We want Monday to be the first day of the week
      let firstDayOfWeek = firstDay.getDay();
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday-based (0 = Monday)

      // Fill empty days for start of month (before the 1st)
      for (let j = 0; j < firstDayOfWeek; j++) {
        currentWeek.push(null);
      }

      // Add days of month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, monthIndex, day);
        const dateString = currentDate.toISOString().split('T')[0];
        const count = filteredCalendarData[dateString] || 0; // Use filtered data

        currentWeek.push({ date: currentDate, count });

        // Start new week after Sunday (when we have 7 days in current week)
        if (currentWeek.length === 7) {
          weeks.push([]);
          currentWeek = weeks[weeks.length - 1];
        }
      }

      // Fill remaining days with null to complete the last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
      }

      // Remove empty weeks at the beginning if any
      const filteredWeeks = weeks.filter(week => week.length > 0);

      result.unshift({
        month: monthName,
        year: year,
        weeks: filteredWeeks
      });
    }

    return result;
  }, [filteredCalendarData, selectedYear]);



  const getColorForCount = (count: number) => {
    if (count === 0) return "bg-[#ebedf0] dark:bg-[#2d333b]";
    if (count === 1) return "bg-[#9be9a8] dark:bg-[#0e4429]";
    if (count === 2) return "bg-[#40c463] dark:bg-[#006d32]";
    if (count === 3) return "bg-[#30a14e] dark:bg-[#26a641]";
    return "bg-[#216e39] dark:bg-[#39d353]";
  };

  // Calculate total submissions
  const totalSubmissions = Object.values(filteredCalendarData).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <h3 className="font-semibold">Submission Calendar</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Add shadcn Year Select Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm text-muted-foreground">
              Year:
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-25 h-8">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {totalSubmissions} submissions in {selectedYear}
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex flex-col gap-4">
          {/* Calendar grid - top */}
          <div className="overflow-x-auto">
            <div className="flex gap-2">
              {months.map((monthData, monthIndex) => (
                <div
                  key={monthIndex}
                  className="flex flex-col gap-1"
                  style={{ minWidth: `${monthData.weeks.length * 10}px` }}
                >
                  {monthData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex gap-1">
                      {week.map((day, dayIndex) => (
                        <div key={dayIndex} className="w-[9.2px] h-[9px]">
                          {day ? (
                            <div
                              className={`
                        w-[9.8px] h-[9.6px] rounded-[2px]
                        ${getColorForCount(day.count)}
                        ${day.count > 0 ? 'cursor-pointer hover:opacity-80' : ''}
                      `}
                              title={`${day.date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                            />
                          ) : (
                            <div className="w-[9px] h-[9px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels - bottom */}
          <div className="flex gap-2 text-xs text-muted-foreground">
            {months.map((monthData, index) => (
              <div
                key={index}
                className="text-center"
                style={{ minWidth: `${monthData.weeks.length * 16.8}px` }}
              >
                {monthData.month}
              </div>
            ))}
          </div>
        </div>


        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <span className="text-muted-foreground">Less</span>
          <div className="flex items-center gap-[2px]">
            <div className="w-[15px] h-[15px] rounded-[2px] bg-[#ebedf0] dark:bg-[#2d333b]" />
            <div className="w-[15px] h-[15px] rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
            <div className="w-[15px] h-[15px] rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
            <div className="w-[15px] h-[15px] rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
            <div className="w-[15px] h-[15px] rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
          </div>
          <span className="text-muted-foreground">More</span>
        </div>

        {/* Weekday labels */}
        <div className="mt-4 flex justify-center gap-10 text-[10px] text-muted-foreground">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
      </div>
    </div>
  );
}

// Stats cards component
function StatsCards({ stats }: {
  stats: ReturnType<typeof calculateStats>
}) {
  const statItems = [
    {
      title: "Problems Solved",
      value: stats.totalProblemsSolved,
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      description: "Total unique problems solved"
    },
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      description: "All code submissions"
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      description: `${stats.acceptedSubmissions}/${stats.totalSubmissions} accepted`
    },
    {
      title: "Playlists Created",
      value: stats.playlistsCreated,
      icon: <PlayCircle className="h-5 w-5 text-purple-500" />,
      description: "Problem collections created"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
              <div className="p-2 rounded-full bg-muted">
                {item.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Submission history component
function SubmissionHistory({ submissions, problems }: {
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

function Profile() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const { isAuthenticated, logout, setUser, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const uploadProfileImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await api.patch("/auth/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return res.data
  }

  const {
    data: users,
    isLoading,
    error,
  } = useApiQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/auth/profile");
      return res.data;
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!users) return null;
    return calculateStats(users);
  }, [users]);

  const imageMutation = useApiMutation({
    mutationFn: uploadProfileImage,
    onSuccess: (data) => {
      toast({
        title: "Profile image updated",
        description: "Your profile photo has been updated successfully.",
      })

      setImagePreview(data.imageUrl)
      if (!user) return

      setUser((prev) => {
        if (!prev) return null

        return {
          ...prev,
          imageUrl: data.imageUrl,
        }
      })
    },
    onError: (error) => {
      const apiError = error.response?.data
      toast({
        variant: "destructive",
        title: "Image upload failed",
        description: apiError?.message ?? "Something went wrong",
      })
      setImagePreview(null)
    },
  })

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)
      await publicApi.post("/auth/logout")
      logout()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      navigate({ to: "/login" })
    } finally {
      setIsLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  const handleCameraIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = imagePreview || users?.data.user.imageUrl;
    if (imageUrl) {
      setImageModalOpen(true);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file.",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be under 5MB.",
      })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    imageMutation.mutate(file, {
      onSettled: () => {
        URL.revokeObjectURL(previewUrl)
      }
    })
  }

  const handleAvatarClick = () => {
    if (!imageMutation.isPending) {
      fileInputRef.current?.click()
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: users
      ? {
        firstName: users.data.user.firstName ?? "",
        lastName: users.data.user.lastName ?? "",
        email: users.data.user.email ?? "",
      }
      : undefined,
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    await api.put("/auth/profile", data);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
    setSaving(false);
    reset(data);
  };

  if (isLoading || !users || !stats) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
      {/* DASHBOARD SECTION */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        {/* STATS CARDS */}
        <StatsCards stats={stats} />

        {/* CALENDAR AND INFO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* CALENDAR */}
          <div className="lg:col-span-3">
            <SubmissionCalendar calendarData={stats.submissionCalendar} />
          </div>

          {/* QUICK INFO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(users.data.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant={users.data.user.role === "ADMIN" ? "default" : "secondary"}>
                  {users.data.user.role}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Problems Created</p>
                <p className="font-medium">{stats.problemsCreated}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Difficulty Breakdown</p>
                <div className="space-y-2 mt-2">
                  {Object.entries(stats.difficultyCount).map(([difficulty, count]) => (
                    <div key={difficulty} className="flex items-center justify-between">
                      <span className="text-sm">{difficulty}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SUBMISSION HISTORY */}
        <div className="mt-8">
          <SubmissionHistory
            submissions={stats.recentSubmissions}
            problems={users.data.user.problems}
          />
        </div>
      </div>

      {/* PROFILE EDITING SECTION */}
      <Separator className="my-8" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* LEFT – PROFILE CARD */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div
              className="relative group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div
                className="relative cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg group-hover:border-primary/30 transition-all duration-300">
                  {imageMutation.isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Uploading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <AvatarImage
                        src={imagePreview || users?.data.user.imageUrl || ""}
                        className="group-hover:brightness-75 transition-all duration-300"
                      />
                      <AvatarFallback className="text-2xl group-hover:brightness-75 transition-all duration-300">
                        {users?.data.user.firstName?.charAt(0)}
                        {users?.data.user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div className={`
                  absolute inset-0 flex flex-col items-center justify-center 
                  rounded-full bg-black/60 text-white opacity-0 
                  group-hover:opacity-100 transition-all duration-300
                  ${imageMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}>
                  {imageMutation.isPending ? (
                    <>
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">
                        {users?.data.user.imageUrl || imagePreview ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`
                  absolute -bottom-2 -right-2 h-10 w-10 rounded-full 
                  bg-primary text-primary-foreground flex items-center justify-center 
                  shadow-lg border-4 border-background
                  transition-all duration-300
                  ${isHovering ? 'scale-110 rotate-12' : 'scale-100'}
                  ${(users?.data.user.imageUrl || imagePreview) ? 'cursor-pointer hover:bg-primary/90' : 'cursor-default'}
                `}
                onClick={handleCameraIconClick}
                title="View profile photo"
              >
                {imageMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageChange}
                disabled={imageMutation.isPending}
              />
            </div>

            <div className="text-center mt-4">
              <p className="font-semibold text-lg">
                {users?.data.user.firstName} {users?.data.user.lastName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{users?.data.user.email}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {users?.data.user.accounts.map((acc) => (
                <Badge key={acc.provider} variant="secondary">
                  {acc.provider === "GOOGLE" ? "Google" : "Local"}
                </Badge>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 cursor-pointer sm:hidden"
              onClick={handleAvatarClick}
              disabled={imageMutation.isPending}
            >
              {imageMutation.isPending ? (
                <>
                  <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              className="w-full mt-6 cursor-pointer"
              onClick={() => setLogoutOpen(true)}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT – FORM */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  htmlFor="firstName"
                  error={errors.firstName?.message}
                  required
                >
                  <Input
                    {...register("firstName")}
                    placeholder="First name"
                    error={!!errors.firstName}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  htmlFor="lastName"
                  error={errors.lastName?.message}
                  required
                >
                  <Input
                    {...register("lastName")}
                    placeholder="Last name"
                    error={!!errors.lastName}
                  />
                </FormField>
              </div>

              <FormField
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <Input
                  disabled
                  {...register("email")}
                  placeholder="Email"
                  error={!!errors.email}
                />
              </FormField>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">
                  Authentication Providers
                </p>
                <div className="flex gap-2 flex-wrap">
                  {users?.data.user.accounts.map((acc) => (
                    <Badge key={acc.provider} variant="outline">
                      {acc.provider === "GOOGLE"
                        ? "Google OAuth"
                        : "Email & Password"}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!isDirty || saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <LogoutDialog
        open={logoutOpen}
        onOpenChange={!isLoggingOut ? setLogoutOpen : () => { }}
        onConfirm={handleLogout}
        loading={isLoggingOut}
      />
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview || users?.data.user.imageUrl || ""}
                alt="Profile photo"
                className="max-h-[60vh] max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${users?.data.user.firstName}+${users?.data.user.lastName}&background=random`;
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageMutation.isPending}
            >
              {imageMutation.isPending ? (
                <>
                  <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </>
              )}
            </Button>
            <Button onClick={() => setImageModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl mt-8" />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl md:col-span-2" />
      </div>
    </div>
  );
}