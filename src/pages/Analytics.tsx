
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  BarChart, 
  Bar, 
  Pie, 
  Cell, 
  ResponsiveContainer,  
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import Layout from '@/components/Layout';

const Analytics = () => {
  const { 
    getUserGroups, 
    expenses, 
    getGroupExpenses, 
    getUserTotalBalance, 
    getTotalSpent 
  } = useData();

  const groups = getUserGroups();
  const totalBalance = getUserTotalBalance();
  const totalSpent = getTotalSpent();

  // Group expenses by group for pie chart
  const expensesByGroup = groups.map(group => {
    const groupExpenses = getGroupExpenses(group.id);
    const total = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      name: group.name,
      value: total,
    };
  }).filter(item => item.value > 0);

  // Prepare data for the expense trend chart (last 5 expenses)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      return {
        name: expense.description,
        amount: expense.amount,
        group: group?.name || 'Unknown',
        date: new Date(expense.date).toLocaleDateString(),
      };
    })
    .reverse();

  // Colors for the pie chart
  const COLORS = ['#38B2AC', '#4FD1CB', '#2C8A86', '#68D391', '#9AE6B4', '#48BB78'];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Overview of your spending patterns and balances</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="font-semibold">${totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className={`font-semibold ${totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {totalBalance >= 0 ? '+' : ''}${Math.abs(totalBalance).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Groups:</span>
                  <span className="font-semibold">{groups.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-semibold">{expenses.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Group</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              {expensesByGroup.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByGroup}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByGroup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
            <TabsTrigger value="groups">Group Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expense Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {recentExpenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentExpenses}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                        labelFormatter={(label) => `Expense: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Amount" fill="#38B2AC" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No recent expenses to display
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Spending Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length > 0 ? (
                  <div className="space-y-6">
                    {groups.map(group => {
                      const groupExpenses = getGroupExpenses(group.id);
                      const totalAmount = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                      
                      return (
                        <div key={group.id} className="space-y-2">
                          <h3 className="font-medium">{group.name}</h3>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total spent:</span>
                            <span>${totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Number of expenses:</span>
                            <span>{groupExpenses.length}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Average expense:</span>
                            <span>
                              ${groupExpenses.length > 0 
                                ? (totalAmount / groupExpenses.length).toFixed(2) 
                                : '0.00'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{
                                width: `${Math.min(100, (totalAmount / Math.max(...groups.map(g => {
                                  const expenses = getGroupExpenses(g.id);
                                  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
                                }))) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No group data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;
