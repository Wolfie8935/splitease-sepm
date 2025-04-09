import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Loader2, RefreshCw, Trash2, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'ag2351@srmist.edu.in';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { isAdmin, users, loading, fetchUsers, deleteUser, resetUserPassword, updateUserPassword } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    // Double check both isAdmin and email
    if (!isAdmin || currentUser?.email !== ADMIN_EMAIL) {
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [isAdmin, currentUser, fetchUsers, navigate]);

  // Immediate check for both isAdmin and correct email
  if (!isAdmin || currentUser?.email !== ADMIN_EMAIL) {
    return null;
  }

  const handleDeleteUser = async (userId: string) => {
    // Verify admin status before each action
    if (!isAdmin || currentUser?.email !== ADMIN_EMAIL) {
      toast({
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteUser(userId);
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    // Verify admin status before each action
    if (!isAdmin || currentUser?.email !== ADMIN_EMAIL) {
      toast({
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await resetUserPassword(email);
      toast({
        title: 'Password reset email sent',
        description: 'A password reset link has been sent to the user\'s email.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePassword = async () => {
    // Verify admin status before each action
    if (!isAdmin || currentUser?.email !== ADMIN_EMAIL) {
      toast({
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUser || !newPassword) return;

    try {
      await updateUserPassword(selectedUser.id, newPassword);
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
      toast({
        title: 'Password updated',
        description: 'The user\'s password has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // If not admin, don't render anything (will be redirected by useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...users]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={isPasswordDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setIsPasswordDialogOpen(open);
                          if (!open) {
                            setSelectedUser(null);
                            setNewPassword('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              title="Set new password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set New Password</DialogTitle>
                              <DialogDescription>
                                Set a new password for {user.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleUpdatePassword}
                                disabled={!newPassword}
                              >
                                Update Password
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.email)}
                          title="Send password reset email"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 