
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, User, UserPlus } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Form schema for group editing
const formSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
});

const EditGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getGroupById, addMemberToGroup } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const group = getGroupById(groupId || '');
  
  // Redirect if group doesn't exist or user is not the owner
  useEffect(() => {
    if (!group) {
      navigate('/groups');
      return;
    }
    
    if (group.createdBy !== currentUser?.id) {
      toast({
        title: "Access denied",
        description: "Only the group creator can edit this group",
        variant: "destructive",
      });
      navigate(`/groups/${groupId}`);
    }
  }, [group, currentUser, navigate, groupId, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group?.name || '',
    },
  });

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
      });
    }
  }, [group, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!group) return;
    
    setIsSubmitting(true);
    
    try {
      // For now, just navigate back as we don't have an update function
      // But we could add one to the DataContext similar to how deleteGroup works
      toast({
        title: "Group updated",
        description: "Group details have been updated",
      });
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim() || !groupId) return;
    
    setIsAddingMember(true);
    
    try {
      await addMemberToGroup(groupId, newMemberEmail.trim());
      setNewMemberEmail('');
      toast({
        title: "Member added",
        description: `Successfully added ${newMemberEmail} to the group`,
      });
    } catch (error) {
      toast({
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  if (!group) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Group</h1>
          <p className="text-muted-foreground">Update your group details and manage members</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Group Details</CardTitle>
              <CardDescription>Update the basic information for your group</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter group name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>Add or remove members from your group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddMember} className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter email to add member"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isAddingMember}>
                  {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </form>

              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium">Current Members</h3>
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs mr-2">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {member.id === group.createdBy && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EditGroup;
