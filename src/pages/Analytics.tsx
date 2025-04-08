import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

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

  // Enhanced color palette for charts
  const PIE_COLORS = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
    '#F97316'  // Orange
  ];

  // For group bars
  const BAR_COLOR = '#4F46E5';
  const HOVER_BAR_COLOR = '#6366F1';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Analytics</h1>
        <p className="text-muted-foreground">Overview of your spending patterns and balances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-t-lg">
            <CardTitle className="text-indigo-700 dark:text-indigo-300">Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                <span className="text-muted-foreground">Total Spent:</span>
                <span className="font-semibold text-xl">${totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className={`font-semibold text-xl ${totalBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {totalBalance >= 0 ? '+' : ''}${Math.abs(totalBalance).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                <span className="text-muted-foreground">Active Groups:</span>
                <span className="font-semibold text-xl text-sky-500">{groups.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                <span className="text-muted-foreground">Total Expenses:</span>
                <span className="font-semibold text-xl text-amber-500">{expenses.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-t-lg">
            <CardTitle className="text-indigo-700 dark:text-indigo-300">Expenses by Group</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center pt-6">
            {expensesByGroup.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByGroup}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1500}
                    animationBegin={200}
                  >
                    {expensesByGroup.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
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

      <Tabs defaultValue="expenses" className="mt-6">
        <TabsList className="w-full mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger 
            value="expenses" 
            className="text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            Recent Expenses
          </TabsTrigger>
          <TabsTrigger 
            value="groups" 
            className="text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            Group Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="mt-0">
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-t-lg">
              <CardTitle className="text-indigo-700 dark:text-indigo-300">Recent Expense Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px] pt-6">
              {recentExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentExpenses}>
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                      labelFormatter={(label) => `Expense: ${label}`}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name="Amount" 
                      fill={BAR_COLOR}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationBegin={200}
                    />
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
        
        <TabsContent value="groups" className="mt-0">
          <Card className="shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-t-lg">
              <CardTitle className="text-indigo-700 dark:text-indigo-300">Group Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {groups.length > 0 ? (
                <div className="space-y-8">
                  {groups.map(group => {
                    const groupExpenses = getGroupExpenses(group.id);
                    const totalAmount = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                    const maxGroupExpense = Math.max(...groups.map(g => {
                      const expenses = getGroupExpenses(g.id);
                      return expenses.reduce((sum, exp) => sum + exp.amount, 0);
                    }));
                    const percentage = maxGroupExpense > 0 ? (totalAmount / maxGroupExpense) * 100 : 0;
                    
                    return (
                      <div key={group.id} className="space-y-3 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <h3 className="font-medium text-lg text-indigo-600 dark:text-indigo-400">{group.name}</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Total spent</span>
                            <p className="text-xl font-semibold">${totalAmount.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Expenses</span>
                            <p className="text-xl font-semibold">{groupExpenses.length}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Average</span>
                            <p className="text-xl font-semibold">
                              ${groupExpenses.length > 0 
                                ? (totalAmount / groupExpenses.length).toFixed(2) 
                                : '0.00'}
                            </p>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                            <div 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            ></div>
                          </div>
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
  );
};

export default Analytics;
