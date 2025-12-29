// src/components/problems/problems-table.tsx
import { useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Filter, Plus, Bookmark, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ProblemsTableSkeleton } from "./ProblemsTableSkeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import type { GetProblemsParams, Problem } from "@/lib/api/problems";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteProblem } from "@/lib/api/problems";

interface ProblemsTableProps {
    data: Problem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    params: GetProblemsParams;
    onParamsChange: (params: GetProblemsParams) => void;
    onRefresh?: () => void;
}

export function ProblemsTable({
    data,
    pagination,
    isLoading,
    isError,
    error,
    params,
    onParamsChange,
    onRefresh,
}: ProblemsTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [problemToDelete, setProblemToDelete] = useState<string | null>(null);
    const { toast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const navigate = useNavigate();

    // Extract unique tags for filter
    const allTags = Array.from(
        new Set(data?.flatMap((problem) => problem.tags) || [])
    ).sort();

    const handleSearch = useCallback(
        (value: string) => {
            onParamsChange({ ...params, search: value || undefined, page: 1 });
        },
        [params, onParamsChange]
    );

    const handleDifficultyChange = useCallback(
        (value: string) => {
            onParamsChange({
                ...params,
                difficulty: value === "ALL" ? undefined : (value as Problem["difficulty"]),
                page: 1,
            });
        },
        [params, onParamsChange]
    );

    const handleTagChange = useCallback(
        (value: string) => {
            onParamsChange({
                ...params,
                tags: value === "ALL" ? undefined : [value],
                page: 1,
            });
        },
        [params, onParamsChange]
    );

    const handleSortChange = useCallback(
        (field: "createdAt" | "title" | "difficulty") => {
            const newOrder = params.sortBy === field && params.order === "asc" ? "desc" : "asc";
            onParamsChange({ ...params, sortBy: field, order: newOrder });
        },
        [params, onParamsChange]
    );

    const handleDeleteClick = (problemId: string) => {
        setProblemToDelete(problemId);
        setDeleteDialogOpen(true);
    };

    const deleteProblemMutation = useDeleteProblem();

    const handleDeleteConfirm = async () => {
        if (!problemToDelete) return;

        deleteProblemMutation.mutate(problemToDelete, {
            onSuccess: () => {
                toast({
                    title: "Problem deleted successfully",
                    variant: "success",
                    duration: 3000
                });
                onRefresh?.();
            },
            onError: (error) => {
                console.error("Failed to delete problem:", error);
                toast({
                    title: "Failed to delete problem",
                    variant: "destructive",
                    duration: 3000
                });
            },
            onSettled: () => {
                setDeleteDialogOpen(false);
                setProblemToDelete(null);
            }
        });
    };

    const getDifficultyColor = (difficulty: Problem["difficulty"]) => {
        switch (difficulty) {
            case "EASY":
                return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
            case "MEDIUM":
                return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
            case "HARD":
                return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50";
            default:
                return "";
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return <ProblemsTableSkeleton />;
    }

    if (isError) {
        return (
            <div className="w-full max-w-7xl mx-auto p-6">
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="text-destructive">
                                <svg
                                    className="mx-auto h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Failed to load problems</h3>
                                <p className="text-muted-foreground mt-1">
                                    {error?.message || "An unexpected error occurred"}
                                </p>
                            </div>
                            <Button onClick={onRefresh} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
                    <p className="text-muted-foreground">
                        Browse and solve coding challenges
                    </p>
                </div>

                {
                    isAuthenticated && (
                        <Button className="gap-2 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            Create Playlist
                        </Button>
                    )
                }

            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <CardTitle>Filters</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search problems by title or description..."
                                    value={params.search || ""}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Select
                                value={params.difficulty || "ALL"}
                                onValueChange={handleDifficultyChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Difficulties</SelectItem>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={params.tags?.[0] || "ALL"}
                                onValueChange={handleTagChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Tags" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Tags</SelectItem>
                                    {allTags.map((tag) => (
                                        <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} problems
                </span>
                <div className="flex items-center gap-4">
                    <Select
                        value={params.sortBy || "createdAt"}
                        onValueChange={(value) =>
                            handleSortChange(value as "createdAt" | "title" | "difficulty")
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">Date</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="difficulty">Difficulty</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            onParamsChange({
                                ...params,
                                order: params.order === "asc" ? "desc" : "asc",
                            })
                        }
                    >
                        {params.order === "asc" ? "↑" : "↓"}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {
                                    isAdmin && (
                                        <TableHead className="w-12.5">
                                            <Checkbox disabled />
                                        </TableHead>
                                    )
                                }
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSortChange("title")}
                                >
                                    Title
                                    {params.sortBy === "title" && (
                                        <span className="ml-1">{params.order === "asc" ? "↑" : "↓"}</span>
                                    )}
                                </TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead
                                    className="w-[120px] cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSortChange("difficulty")}
                                >
                                    Difficulty
                                    {params.sortBy === "difficulty" && (
                                        <span className="ml-1">{params.order === "asc" ? "↑" : "↓"}</span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="w-[140px] cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSortChange("createdAt")}
                                >
                                    Created
                                    {params.sortBy === "createdAt" && (
                                        <span className="ml-1">{params.order === "asc" ? "↑" : "↓"}</span>
                                    )}
                                </TableHead>
                                {
                                    isAdmin && (
                                        <TableHead className="w-40">Actions</TableHead>
                                    )
                                }
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((problem) => (
                                    <TableRow key={problem.id} className="group">
                                        {
                                            isAdmin && (
                                                <TableCell>
                                                    <Checkbox className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                                                </TableCell>
                                            )
                                        }
                                        <TableCell>
                                            <Link
                                                to="/problems/$id"
                                                params={{ id: problem.id }}
                                                className="font-medium text-primary hover:underline transition-colors inline-flex items-center gap-2"
                                            >
                                                {problem.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {problem.tags.slice(0, 3).map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="text-xs font-normal"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {problem.tags.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{problem.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`${getDifficultyColor(
                                                    problem.difficulty
                                                )} border-0 font-medium capitalize`}
                                            >
                                                {problem.difficulty.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(problem.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {
                                                    isAdmin && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                asChild
                                                            >
                                                                <Link to="/problems/$id" params={{ id: problem.id }}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteClick(problem.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )
                                                }
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 ml-2"
                                                >
                                                    <Bookmark className="h-4 w-4" />
                                                    Save
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="rounded-full bg-muted p-3">
                                                <Search className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">No problems found</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Try adjusting your search or filter to find what you're looking for.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    onParamsChange({
                                                        page: 1,
                                                        limit: 10,
                                                        sortBy: "createdAt",
                                                        order: "desc",
                                                    })
                                                }
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => onParamsChange({ ...params, page: pagination.page - 1 })}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pagination.page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => onParamsChange({ ...params, page: pageNum })}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => onParamsChange({ ...params, page: pagination.page + 1 })}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the problem
                            and remove it from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter >
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteProblemMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            disabled={deleteProblemMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteProblemMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}