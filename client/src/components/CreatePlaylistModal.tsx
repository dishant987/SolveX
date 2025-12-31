import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { playlistSchema } from "@/lib/validations";
import type z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useCreatePlayList } from "@/lib/api/problems";
import { LoadingSpinner } from "./LoadingSpinner";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormData = z.infer<typeof playlistSchema>;

const CreatePlaylistModal = ({ isOpen, onClose }: CreatePlaylistModalProps) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(playlistSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createPlayList = useCreatePlayList();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      await createPlayList.mutateAsync(data);
      reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
      console.error("Create playlist error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header with close button */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold ">
                Create New Playlist
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Organize your favorite coding problems into a personalized playlist
              </DialogDescription>
            </div>

          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6 p-6"
          noValidate
        >
          {/* Name field */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="name"
                className="text-sm font-medium "
              >
                Playlist Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              {errors.name && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name.message}
                </div>
              )}
            </div>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Dynamic Programming Mastery"
              className={cn(
                "h-11 transition-all",
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "focus:border-blue-500 focus:ring-blue-500"
              )}
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </div>

          {/* Description field */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="description"
                className="text-sm font-medium "
              >
                Description
                <span className="text-gray-400 text-sm font-normal ml-2">
                  Optional
                </span>
              </Label>
              {errors.description && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description.message}
                </div>
              )}
            </div>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what this playlist focuses on..."
              className={cn(
                "min-h-25 resize-y transition-all",
                errors.description
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "focus:border-blue-500 focus:ring-blue-500"
              )}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
            />

          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createPlayList.isPending}
              className="h-11 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPlayList.isPending || !isValid || !isDirty}
              className="h-11 flex-1 sm:flex-none gap-2 transition-all"
              variant="default"
            >
              {createPlayList.isPending ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Create Playlist
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistModal;