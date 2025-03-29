
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  User
} from 'lucide-react';
import Layout from '@/components/Layout';
import AddExpenseForm from '@/components/AddExpenseForm';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getGroupById, getGroupExpenses, getGroupBalances } = useData();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  if (!groupId) {
    navigate('/groups');
    return null;
  }

  const group = getGroupById(groupId);
  if (!group) {
    navigate('/groups');
    return null;
  }

  const expenses = getGroupExpenses(groupId);
  const balances = getGroupBalances(groupId);

  // Find current user's balance
  const userBalance = balances.find(b => b.userId === currentUser?.id);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/groups')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{group.name}</h1>
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

        <Button onClick={() => setIsExpenseModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
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
                              <User className="mr-1 h-3 w-3" />
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
          
          <TabsContent value="members" className="space-y-4 mt-4">
            {group.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
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
    </Layout>
  );
};

export default GroupDetail;
