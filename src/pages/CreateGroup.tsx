import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, X } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateGroup = () => {
  const [name, setName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const { createGroup, isLoading } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddMember = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleRemoveMember = (index: number) => {
    const newMemberEmails = [...memberEmails];
    newMemberEmails.splice(index, 1);
    setMemberEmails(newMemberEmails);
  };

  const handleMemberEmailChange = (index: number, value: string) => {
    const newMemberEmails = [...memberEmails];
    newMemberEmails[index] = value;
    setMemberEmails(newMemberEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Filter out empty emails
    const validEmails = memberEmails.filter(email => email.trim() !== '');

    if (!name) {
      setError('Group name is required');
      return;
    }

    try {
      console.log('Creating group with name:', name, 'and members:', validEmails);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to create a group');
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a group",
          variant: "destructive",
        });
        return;
      }
      
      const newGroup = await createGroup(name, validEmails);
      
      if (!newGroup || !newGroup.id) {
        throw new Error('Failed to create group - no group ID returned');
      }
      
      toast({
        title: "Success!",
        description: `Group "${name}" has been created successfully.`,
      });
      navigate(`/groups/${newGroup.id}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create group',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Group</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new expense sharing group
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., Roommates, Trip to Paris"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Members (by Email)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add the email addresses of people you want to include in this group
              </p>
              
              <div className="space-y-2">
                {memberEmails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => handleMemberEmailChange(index, e.target.value)}
                    />
                    {memberEmails.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleAddMember}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Member
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateGroup;
