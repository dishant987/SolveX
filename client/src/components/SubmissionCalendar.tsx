import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useMemo, useState } from "react";


export function SubmissionCalendar({ calendarData }: { calendarData: Record<string, number> }) {

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