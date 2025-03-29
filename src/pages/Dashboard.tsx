import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  PieChart, 
  PlusCircle, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle 
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [userName, setUserName] = useState<string>('');
  const { currentUser } = useAuth();
  const { 
    getUserGroups, 
    getUserTotalBalance, 
    getTotalSpent,
    isLoading 
  } = useData();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', currentUser.id)
          .single();
        
        if (data && !error) {
          setUserName(data.name);
        } else {
          setUserName('User');
        }
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const groups = getUserGroups();
  const totalBalance = getUserTotalBalance();
  const totalSpent = getTotalSpent();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userName || 'User'}</h1>
          <p className="text-muted-foreground">Here's an overview of your expenses and groups</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <DollarSign className={totalBalance >= 0 ? "text-green-500" : "text-red-500"} />
              <span className="text-2xl font-bold">
                {totalBalance >= 0 ? '+' : ''}
                ${Math.abs(totalBalance).toFixed(2)}
              </span>
            </CardContent>
            <CardDescription className="px-6 pb-4">
              {totalBalance >= 0 
                ? "You are owed money" 
                : "You owe money"}
            </CardDescription>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <ArrowUpCircle className="text-primary" />
              <span className="text-2xl font-bold">${totalSpent.toFixed(2)}</span>
            </CardContent>
            <CardDescription className="px-6 pb-4">
              Your total expenses across all groups
            </CardDescription>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Groups</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Users className="text-primary" />
              <span className="text-2xl font-bold">{groups.length}</span>
            </CardContent>
            <CardDescription className="px-6 pb-4">
              Groups you're currently part of
            </CardDescription>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Groups</h2>
            <Button asChild>
              <Link to="/groups/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Group
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading your groups...</div>
          ) : groups.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {groups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`}>
                  <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>{group.members.length} members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created on {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="py-8">
              <div className="text-center space-y-4">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-medium">No groups yet</h3>
                <p className="text-muted-foreground">
                  Create a new group to start tracking expenses with friends
                </p>
                <Button asChild className="mt-2">
                  <Link to="/groups/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Group
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Spending Overview</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              View detailed analytics of your expenses across all groups
            </p>
            <Button asChild>
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
