
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Users, 
  Trash2,
  MoreVertical,
  Pencil
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

const Groups = () => {
  const { getUserGroups, deleteGroup, isLoading } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const groups = getUserGroups();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    try {
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
    }
  };

  const openDeleteDialog = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  return (
    <Layout>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow relative">
                  {currentUser?.id === group.createdBy && (
                    <div 
                      className="absolute top-3 right-3 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            asChild
                          >
                            <Link to={`/groups/${group.id}/edit`} onClick={(e) => e.stopPropagation()}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Group
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => openDeleteDialog(group.id, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>{group.members.length} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((member, index) => (
                          <div 
                            key={member.id} 
                            className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-background"
                            title={member.name}
                          >
                            {member.name.charAt(0)}
                          </div>
                        ))}
                        
                        {group.members.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-background">
                            +{group.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Created on {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8">
            <div className="text-center space-y-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-medium">No groups yet</h3>
              <p className="text-muted-foreground">
                Create a new group to start tracking expenses with friends
              </p>
              <Button asChild className="mt-2">
                <Link to="/groups/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              group and all of its expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Groups;
