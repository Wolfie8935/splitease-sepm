import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const SettleUp = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { getGroupById, getGroupBalances, addExpense } = useData();
  const { toast } = useToast();
  const [isSettling, setIsSettling] = useState(false);
  const [settledAmount, setSettledAmount] = useState<number | ''>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [memberDisplayNames, setMemberDisplayNames] = useState<Record<string, string>>({});

  if (!groupId) {
    navigate('/groups');
    return null;
  }

  const group = getGroupById(groupId);
  if (!group) {
    navigate('/groups');
    return null;
  }

  const balances = getGroupBalances(groupId);
  const currentUserBalance = balances.find(b => b.userId === currentUser?.id);
  
  // Function to get display name when available
  const getMemberName = (userId: string) => {
    const user = balances.find(b => b.userId === userId);
    return memberDisplayNames[userId] || user?.userName || 'Unknown';
  };
  
  // Filter for people the current user owes money to or is owed money by
  const usersToPayBack = balances.filter(balance => {
    return currentUserBalance && currentUserBalance.amount < 0 && balance.amount > 0;
  });

  // Filter for people who owe the current user money
  const usersOwingMoney = balances.filter(balance => {
    return currentUserBalance && currentUserBalance.amount > 0 && balance.amount < 0;
  });

  // Check for URL parameters and set values if provided
  useEffect(() => {
    const toUserId = searchParams.get('to');
    const amount = searchParams.get('amount');
    
    if (toUserId) {
      setSelectedUser(toUserId);
    }
    
    if (amount) {
      setSettledAmount(parseFloat(amount));
    }
  }, [searchParams]);

  // Fetch display names for all members
  useEffect(() => {
    const fetchMemberDisplayNames = async () => {
      if (!group) return;
      
      const displayNames: Record<string, string> = {};
      
      for (const member of group.members) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', member.id)
            .single();
          
          if (error) throw error;
          
          if (data && data.display_name) {
            displayNames[member.id] = data.display_name;
          }
        } catch (error) {
          console.error('Error fetching member display name:', error);
        }
      }
      
      setMemberDisplayNames(displayNames);
    };
    
    fetchMemberDisplayNames();
  }, [group]);

  const handleSettleUp = async () => {
    if (!settledAmount || settledAmount <= 0 || !selectedUser || !currentUser) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and select a user to settle up with",
        variant: "destructive",
      });
      return;
    }

    setIsSettling(true);
    try {
      // Add a settlement expense
      const selectedUserDisplayName = getMemberName(selectedUser);
      
      await addExpense(
        groupId,
        `Settlement payment to ${selectedUserDisplayName}`,
        Number(settledAmount),
        currentUser.id, // Current user is paying
        'custom',
        [{ userId: selectedUser, amount: Number(settledAmount) }] // All goes to the selected user
      );

      toast({
        title: "Success!",
        description: `Successfully settled up $${settledAmount} with ${selectedUserDisplayName}`,
      });
      
      // Reset form
      setSettledAmount('');
      setSelectedUser('');
      
      // Navigate back to group detail
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error settling up:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to settle up',
        variant: "destructive",
      });
    } finally {
      setIsSettling(false);
    }
  };

  const handleMarkAsSettled = async () => {
    if (!settledAmount || settledAmount <= 0 || !selectedUser || !currentUser) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and select a user to mark as settled",
        variant: "destructive",
      });
      return;
    }

    setIsSettling(true);
    try {
      // Add a settlement expense
      const selectedUserDisplayName = getMemberName(selectedUser);
      
      await addExpense(
        groupId,
        `Settlement received from ${selectedUserDisplayName}`,
        Number(settledAmount),
        selectedUser, // Selected user is marked as the payer
        'custom',
        [{ userId: currentUser.id, amount: Number(settledAmount) }] // Current user receives the money
      );

      toast({
        title: "Success!",
        description: `Successfully recorded settlement of $${settledAmount} from ${selectedUserDisplayName}`,
      });
      
      // Reset form
      setSettledAmount('');
      setSelectedUser('');
      
      // Navigate back to group detail
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error recording settlement:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to record settlement',
        variant: "destructive",
      });
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/groups/${groupId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Settle Up - {group.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className={currentUserBalance && currentUserBalance.amount >= 0 ? "text-green-500" : "text-red-500"} />
            <span className="text-2xl font-bold">
              {currentUserBalance && currentUserBalance.amount >= 0 ? '+' : ''}
              ${currentUserBalance ? Math.abs(currentUserBalance.amount).toFixed(2) : '0.00'}
            </span>
            <span className="text-muted-foreground">
              {currentUserBalance && currentUserBalance.amount >= 0 
                ? "You are owed money" 
                : "You owe money"}
            </span>
          </div>

          {currentUserBalance && currentUserBalance.amount < 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settle Up with Someone</h3>
              
              {usersToPayBack.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Pay</Label>
                    <select 
                      id="user"
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Select a person</option>
                      {usersToPayBack.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {getMemberName(user.userId)} (${user.amount.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex items-center">
                      <span className="mr-2">$</span>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={settledAmount}
                        onChange={(e) => setSettledAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0.00"
                        className="bg-background text-foreground"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSettleUp} 
                    disabled={isSettling || !settledAmount || !selectedUser}
                    className="w-full"
                  >
                    {isSettling ? 'Processing...' : 'Settle Up'}
                    {!isSettling && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <p>There's no one to settle up with right now.</p>
              )}
            </div>
          ) : currentUserBalance && currentUserBalance.amount > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Record Payment Received</h3>
              
              {usersOwingMoney.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Received From</Label>
                    <select 
                      id="user"
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Select a person</option>
                      {usersOwingMoney.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {getMemberName(user.userId)} (${Math.abs(user.amount).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex items-center">
                      <span className="mr-2">$</span>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={settledAmount}
                        onChange={(e) => setSettledAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0.00"
                        className="bg-background text-foreground"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleMarkAsSettled} 
                    disabled={isSettling || !settledAmount || !selectedUser}
                    className="w-full"
                  >
                    {isSettling ? 'Processing...' : 'Mark as Settled'}
                    {!isSettling && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <p>There's no one who owes you money right now.</p>
              )}
            </div>
          ) : (
            <p>You don't owe any money in this group.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettleUp;
