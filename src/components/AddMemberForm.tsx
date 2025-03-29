
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

interface AddMemberFormProps {
  groupId: string;
  onSuccess: () => void;
  onAddMember: (email: string) => Promise<void>;
}

const AddMemberForm = ({ groupId, onSuccess, onAddMember }: AddMemberFormProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onAddMember(email);
      setEmail('');
      onSuccess();
      toast({
        title: "Member added",
        description: `Invitation sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberEmail">Email Address</Label>
        <Input
          id="memberEmail"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Member'}
      </Button>
    </form>
  );
};

export default AddMemberForm;
