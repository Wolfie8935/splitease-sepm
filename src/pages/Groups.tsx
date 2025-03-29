
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import Layout from '@/components/Layout';

const Groups = () => {
  const { getUserGroups, isLoading } = useData();
  const groups = getUserGroups();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Your Groups</h1>
            <p className="text-muted-foreground">Manage and view all your expense groups</p>
          </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>{group.members.length} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((member, index) => (
                          <div 
                            key={member.id} 
                            className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-white"
                            title={member.name}
                          >
                            {member.name.charAt(0)}
                          </div>
                        ))}
                        
                        {group.members.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-white">
                            +{group.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
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
    </Layout>
  );
};

export default Groups;
