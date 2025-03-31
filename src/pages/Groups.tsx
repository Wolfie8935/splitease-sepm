
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from '@/components/AppLayout';
import GroupList from '@/components/groups/GroupList';
import EmptyGroupState from '@/components/groups/EmptyGroupState';
import { useGroupDeletion } from '@/hooks/useGroupDeletion';

const Groups = () => {
  const { getUserGroups, isLoading } = useData();
  const { currentUser } = useAuth();
  const groups = getUserGroups();
  
  const {
    deleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
    openDeleteDialog,
    handleDialogOpenChange
  } = useGroupDeletion();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Your Groups</h1>
            <p className="text-muted-foreground">Manage and view all your expense groups</p>
          </div>
          <Button asChild>
            <Link to="/groups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading your groups...</div>
        ) : groups.length > 0 ? (
          <GroupList 
            groups={groups} 
            currentUserId={currentUser?.id} 
            onDeleteClick={openDeleteDialog} 
          />
        ) : (
          <EmptyGroupState />
        )}
      </div>

      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              group and all of its expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Groups;
