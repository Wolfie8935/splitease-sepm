import AddExpenseForm from '@/components/AddExpenseForm';
import AddMemberForm from '@/components/AddMemberForm';
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import {
    ArrowLeft,
    ArrowRightLeft,
    Check,
    Clock,
    DollarSign,
    Edit,
    Plus,
    UserMinus,
    UserPlus,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getGroupById, getGroupExpenses, getGroupBalances, addMemberToGroup, removeMemberFromGroup } = useData();
  const { toast } = useToast();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({});
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

  const isAdmin = currentUser?.id === group.createdBy;

  const expenses = getGroupExpenses(groupId);
  const balances = getGroupBalances(groupId);

  const userBalance = balances.find(b => b.userId === currentUser?.id);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!group) return;
      
      const avatars: Record<string, string> = {};
      const displayNames: Record<string, string> = {};
      
      for (const member of group.members) {
        try {
          // Get profile details including avatar_url and display_name
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url, display_name')
            .eq('id', member.id)
            .single();
          
          if (error) throw error;
          
          if (data && data.avatar_url) {
            const { data: avatarData } = await supabase
              .storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
              
            avatars[member.id] = avatarData.publicUrl;
          }
          
          if (data && data.display_name) {
            displayNames[member.id] = data.display_name;
          }
        } catch (error) {
          console.error('Error fetching member details:', error);
        }
      }
      
      setMemberAvatars(avatars);
      setMemberDisplayNames(displayNames);
    };
    
    fetchMemberDetails();
  }, [group]);

  const getMemberName = (memberId: string) => {
    const member = group.members.find(m => m.id === memberId);
    return memberDisplayNames[memberId] || member?.name || 'Unknown';
  };

  // Calculate actual spending by each user (considering both what they paid and what they were assigned)
  const calculateTotalSpentByUser = (userId: string) => {
    // Calculate total amount paid by this user
    const amountPaid = expenses
      .filter(expense => expense.paidBy === userId)
      .reduce((total, expense) => total + expense.amount, 0);
    
    // Calculate total amount this user was responsible for (their portion of expenses)
    const amountOwed = expenses.reduce((total, expense) => {
      const userSplit = expense.splits.find(split => split.userId === userId);
      return total + (userSplit?.amount || 0);
    }, 0);
    
    // The actual amount spent by this user is what they paid minus what they owed
    return amountPaid - amountOwed;
  };

  // Calculate total money paid by a user (without considering splits)
  const calculateTotalPaidByUser = (userId: string) => {
    return expenses
      .filter(expense => expense.paidBy === userId)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const handleAddMember = async (email: string) => {
    await addMemberToGroup(groupId, email);
  };

  const startEditingNickname = (memberId: string, currentName: string) => {
    setEditingNickname(memberId);
    setNickname(currentName);
  };

  const saveNickname = () => {
    // In a real implementation, this would save to the database
    // For now we'll just clear the editing state
    setEditingNickname(null);
    setNickname('');
    
    // Show a toast notification
    // This would be implemented properly with user context and database
  };

  // Calculate who pays whom to settle debts
  const calculateSettlements = () => {
    // Create a copy of balances and sort by amount
    const sortedBalances = [...balances].sort((a, b) => a.amount - b.amount);
    const settlements = [];

    let i = 0; // index for people who owe money (negative balance)
    let j = sortedBalances.length - 1; // index for people who are owed money (positive balance)

    while (i < j) {
      const debtor = sortedBalances[i];
      const creditor = sortedBalances[j];

      // Skip people with zero balance
      if (Math.abs(debtor.amount) < 0.01) {
        i++;
        continue;
      }
      if (Math.abs(creditor.amount) < 0.01) {
        j--;
        continue;
      }

      // Calculate payment amount
      const paymentAmount = Math.min(Math.abs(debtor.amount), creditor.amount);

      if (paymentAmount > 0) {
        settlements.push({
          from: debtor.userName,
          fromId: debtor.userId,
          to: creditor.userName,
          toId: creditor.userId,
          amount: paymentAmount
        });

        // Adjust balances
        debtor.amount += paymentAmount;
        creditor.amount -= paymentAmount;
      }

      // Move indices if balances are settled
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (Math.abs(creditor.amount) < 0.01) j--;
    }

    return settlements;
  };

  const settlements = calculateSettlements();
  
  // Calculate how much is owed to the current user from settlements
  const totalOwedToUser = currentUser ? settlements
    .filter(settlement => settlement.toId === currentUser.id)
    .reduce((total, settlement) => total + settlement.amount, 0) : 0;

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId || !currentUser) return;
    
    try {
      setIsRemovingMember(memberId);
      await removeMemberFromGroup(groupId, memberId);
      toast({
        title: "Member removed",
        description: "The member has been removed from the group"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive"
      });
    } finally {
      setIsRemovingMember(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/groups')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{group.name}</h1>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2"
            onClick={() => navigate(`/groups/${groupId}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className={userBalance && userBalance.amount >= 0 ? "text-green-500" : "text-red-500"} />
            <span className="text-2xl font-bold">
              {totalOwedToUser > 0 ? '+' : ''}
              ${totalOwedToUser > 0 ? totalOwedToUser.toFixed(2) : (userBalance ? Math.abs(userBalance.amount).toFixed(2) : '0.00')}
            </span>
            <span className="text-sm text-muted-foreground">
              {totalOwedToUser > 0 
                ? `(You're owed money)` 
                : userBalance && userBalance.amount < 0 
                  ? `(You owe money)` 
                  : `(You're settled up)`}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <DollarSign className="text-primary" />
            <span className="text-2xl font-bold">
              ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="text-primary" />
            <span className="text-2xl font-bold">{group.members.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIsExpenseModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
        
        {isAdmin && (
          <Button variant="outline" onClick={() => setIsMemberModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
        
        {userBalance && userBalance.amount < 0 && (
          <Button variant="outline" onClick={() => navigate(`/groups/${groupId}/settle`)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Settle Up
          </Button>
        )}
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settlements">Settle Up</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4 mt-4">
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const paidByUser = group.members.find(m => m.id === expense.paidBy);
                return (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{expense.description}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Avatar className="mr-2 h-5 w-5">
                              <AvatarImage 
                                src={memberAvatars[expense.paidBy]} 
                                alt={getMemberName(expense.paidBy)} 
                              />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {getMemberName(expense.paidBy).charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span>Paid by {getMemberName(expense.paidBy) || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold">${expense.amount.toFixed(2)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No expenses yet</p>
              <Button onClick={() => setIsExpenseModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Expense
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="balances" className="space-y-4 mt-4">
          {balances.length > 0 ? (
            <div className="space-y-4">
              {balances.map((balance) => (
                <Card key={balance.userId}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarImage 
                            src={memberAvatars[balance.userId]} 
                            alt={balance.userName} 
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {balance.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{getMemberName(balance.userId)}</h3>
                          <div className="text-sm text-muted-foreground">
                            {balance.amount > 0 
                              ? "is owed money" 
                              : balance.amount < 0 
                                ? "owes money" 
                                : "is settled up"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {balance.amount === 0 ? (
                          <div className="text-lg font-bold">
                            ${calculateTotalSpentByUser(balance.userId).toFixed(2)}
                          </div>
                        ) : (
                          <div className={`text-lg font-bold ${
                            balance.amount > 0 
                              ? "text-green-500" 
                              : balance.amount < 0 
                                ? "text-red-500" 
                                : ""
                          }`}>
                            {balance.amount > 0 ? '+' : ''}
                            ${balance.amount.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Total paid: ${calculateTotalPaidByUser(balance.userId).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No balance information available</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="settlements" className="space-y-4 mt-4">
          {settlements.length > 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                These payment recommendations will help settle the group's balances
              </p>
              {settlements.map((settlement, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={memberAvatars[settlement.fromId]} 
                            alt={settlement.from} 
                          />
                          <AvatarFallback className="bg-red-100 text-red-600">
                            {settlement.from.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={memberAvatars[settlement.toId]} 
                            alt={settlement.to} 
                          />
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {settlement.to.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium">{getMemberName(settlement.fromId)}</span> pays <span className="font-medium">{getMemberName(settlement.toId)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold">${settlement.amount.toFixed(2)}</div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            // If current user is the one who owes money
                            if (settlement.fromId === currentUser?.id) {
                              navigate(`/groups/${groupId}/settle?to=${settlement.toId}&amount=${settlement.amount}`);
                            } 
                            // If current user is the one who is owed money
                            else if (settlement.toId === currentUser?.id) {
                              navigate(`/groups/${groupId}/settle?to=${settlement.fromId}&amount=${settlement.amount}`);
                            }
                            // If neither, just use default settlement direction
                            else {
                              navigate(`/groups/${groupId}/settle?to=${settlement.toId}&amount=${settlement.amount}`);
                            }
                          }}
                        >
                          Settle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Everyone is settled up!</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4 mt-4">
          {group.members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="mr-3 h-10 w-10">
                      <AvatarImage 
                        src={memberAvatars[member.id]} 
                        alt={member.name} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {editingNickname === member.id ? (
                        <div className="flex items-center">
                          <Input 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-40 mr-2"
                            autoFocus
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={saveNickname}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-medium flex items-center">
                          {getMemberName(member.id)}
                          {(isAdmin || member.id === currentUser?.id) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-1 h-6 w-6" 
                              onClick={() => startEditingNickname(member.id, member.name)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </h3>
                      )}
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  {member.id === group.createdBy && (
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Group Admin
                    </div>
                  )}
                  {isAdmin && member.id !== group.createdBy && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive bg-destructive/10 hover:bg-destructive/20 ml-2"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isRemovingMember === member.id}
                    >
                      {isRemovingMember === member.id ? (
                        <span>Removing...</span>
                      ) : (
                        <>
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <AddExpenseForm 
            groupId={groupId} 
            onSuccess={() => setIsExpenseModalOpen(false)} 
            members={group.members}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <AddMemberForm 
            groupId={groupId} 
            onSuccess={() => setIsMemberModalOpen(false)}
            onAddMember={handleAddMember}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetail;
