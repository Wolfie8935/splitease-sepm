
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

export const useGroupDeletion = () => {
  const { deleteGroup } = useData();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteGroup(groupToDelete);
      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGroupToDelete(null);
      setDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setDeleteDialogOpen(open);
      if (!open) setGroupToDelete(null);
    }
  };

  return {
    deleteDialogOpen,
    groupToDelete,
    isDeleting,
    openDeleteDialog,
    handleDeleteConfirm,
    handleDialogOpenChange
  };
};
