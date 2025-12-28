import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import type { LogoutDialogProps } from "@/types/types"

export const LogoutDialog = ({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
}: LogoutDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-destructive" />
                        Logout confirmation
                    </DialogTitle>

                    <DialogDescription>
                        Are you sure you want to log out? You will need to sign in again to
                        access your account.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Logging out..." : "Logout"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
