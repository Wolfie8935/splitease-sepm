
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData, Balance } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  DollarSign, 
  Users, 
  ArrowLeft, 
  Clock,
  User,
  UserPlus,
  ArrowRightLeft,
  Edit,
  Check
} from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import AddExpenseForm from '@/components/AddExpenseForm';
import AddMemberForm from '@/components/AddMemberForm';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getGroupById, getGroupExpenses, getGroupBalances, addMemberToGroup } = useData();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');

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

  return (
    <Layout>
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
                {userBalance && userBalance.amount >= 0 ? '+' : ''}
                ${userBalance ? Math.abs(userBalance.amount).toFixed(2) : '0.00'}
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
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {paidByUser?.name.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span>Paid by {paidByUser?.name || 'Unknown'}</span>
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
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {balance.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{balance.userName}</h3>
                            <div className="text-sm text-muted-foreground">
                              {balance.amount > 0 
                                ? "is owed money" 
                                : balance.amount < 0 
                                  ? "owes money" 
                                  : "is settled up"}
                            </div>
                          </div>
                        </div>
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
                            <AvatarFallback className="bg-red-100 text-red-600">
                              {settlement.from.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {settlement.to.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">{settlement.from}</span> pays <span className="font-medium">{settlement.to}</span>
                            </div>
                          </div>
                        </div>
                        <div className="font-bold">${settlement.amount.toFixed(2)}</div>
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
                            {member.name}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
      
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
    </Layout>
  );
};

export default GroupDetail;
