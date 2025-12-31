import { FileText, PlayCircle, TrendingUp, Trophy } from "lucide-react";
import type { calculateStats } from "./CalculateStats";
import { Card, CardContent } from "./ui/card";

export function StatsCards({ stats }: {
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