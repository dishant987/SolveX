import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, PlusCircle, Loader2, Trash2, MoreVertical, Pencil, Check, BookmarkCheck, Bookmark } from "lucide-react";
import { useAddToPlayList, useGetPlayLists, useDeletePlayList, useRemoveFromPlayList } from "@/lib/api/problems";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Playlist {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    problems: Array<{
        id: string;
        playlistId: string;
        problemId: string;
        createdAt: string;
        problem: {
            id: string;
            title: string;
            difficulty: string;
            tags: string[];
        };
    }>;
}

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemId: string;
    onPlaylistCreated?: () => void;
    onPlaylistEdit?: (playlistId: string) => void;
}

const AddToPlaylistModal = ({
    isOpen,
    onClose,
    problemId,
    onPlaylistEdit,
}: AddToPlaylistModalProps) => {
    const { data: playlists, isLoading, isError, refetch } = useGetPlayLists();
    const [addingPlaylistId, setAddingPlaylistId] = useState<string | null>(null);
    const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);
    const [removingPlaylistId, setRemovingPlaylistId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const addToPlayListMutation = useAddToPlayList();
    const deletePlaylistMutation = useDeletePlayList();
    const removeFromPlayListMutation = useRemoveFromPlayList();
    const { toast } = useToast();

    const isProblemInPlaylist = (playlist: Playlist) => {
        return playlist.problems?.some(problem => problem.problemId === problemId);
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        try {
            setAddingPlaylistId(playlistId);
            await addToPlayListMutation.mutateAsync({ problemId, playlistId });
            await refetch();
            onClose();
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 409 && error.response?.data?.code === "DUPLICATE_ENTRY") {
                    toast({
                        title: "Error",
                        description: "Problem already exists in playlist.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to add problem to playlist.",
                        variant: "destructive",
                    });
                }
            }
        } finally {
            setAddingPlaylistId(null);
        }
    };
    const handleRemoveFromPlaylist = async (playlistId: string) => {
        setRemovingPlaylistId(playlistId);
        try {
            await removeFromPlayListMutation.mutateAsync({ playlistId, problemId });
            await refetch();
        } catch (error) {
            console.error("Failed to remove from playlist:", error);
        } finally {
            setRemovingPlaylistId(null);
        }
    };

    const handleDeleteClick = (playlistId: string) => {
        setDeletingPlaylistId(playlistId);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingPlaylistId) return;

        try {
            await deletePlaylistMutation.mutateAsync(deletingPlaylistId);
            toast({
                title: "Success",
                description: "Playlist deleted successfully.",
                variant: "success",
            });
            await refetch();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete playlist.",
                variant: "destructive",
            });
        } finally {
            setShowDeleteDialog(false);
            setDeletingPlaylistId(null);
        }
    };

    const handleEditClick = (playlistId: string) => {
        if (onPlaylistEdit) {
            onClose();
            onPlaylistEdit(playlistId);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-125 p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-semibold">
                                    Add to Playlist
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Select a playlist to add this problem to
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading playlists...</p>
                            </div>
                        ) : isError ? (
                            <div className="text-center py-8 space-y-3">
                                <div className="rounded-full bg-destructive/10 p-3 inline-flex">
                                    <PlusCircle className="h-6 w-6 text-destructive" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Failed to load playlists
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetch()}
                                    className="mt-2"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : playlists?.data && playlists?.data.length > 0 ? (
                            <ScrollArea className="max-h-87.5 pr-4">
                                <div className="space-y-3">
                                    {playlists?.data.map((playlist: Playlist) => {
                                        const isAlreadyAdded = isProblemInPlaylist(playlist);
                                        const problemCount = playlist.problems?.length || 0;

                                        return (
                                            <div
                                                key={playlist.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border hover:bg-accent/10 transition-colors group ${isAlreadyAdded ? 'border-green-200' : ''
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium truncate">
                                                            {playlist.name}
                                                        </h3>

                                                        {
                                                            problemCount > 0 && (
                                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                                    {problemCount} {problemCount === 1 ? 'problem' : 'problems'}
                                                                </span>
                                                            )
                                                        }
                                                    </div>
                                                    {playlist.description && (
                                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                                            {playlist.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => isAlreadyAdded
                                                            ? handleRemoveFromPlaylist(playlist.id)
                                                            : handleAddToPlaylist(playlist.id)
                                                        }
                                                        disabled={addingPlaylistId === playlist.id || removingPlaylistId === playlist.id}
                                                        className={`gap-1.5 ${isAlreadyAdded
                                                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                            : 'text-gray-300 hover:text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {addingPlaylistId === playlist.id || removingPlaylistId === playlist.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : isAlreadyAdded ? (
                                                            <>
                                                                <BookmarkCheck className="h-3.5 w-3.5" />
                                                                <span className="hidden sm:inline">Saved</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bookmark className="h-3.5 w-3.5" />
                                                                <span className="hidden sm:inline">Save</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-accent"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditClick(playlist.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(playlist.id)}
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="rounded-full bg-muted p-3 inline-flex">
                                    <PlusCircle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">No playlists found</p>
                                    <p className="text-sm text-muted-foreground">
                                        Create your first playlist to organize coding problems
                                    </p>
                                </div>
                                <Button
                                    className="mt-2 gap-2"
                                    onClick={() => {
                                        onClose();
                                    }}
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Create Playlist
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 mt-4 border-t">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full hover:bg-accent/10"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Playlist</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this playlist? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deletePlaylistMutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            disabled={deletePlaylistMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePlaylistMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddToPlaylistModal;