
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle } from 'lucide-react';

const EmptyGroupState = () => {
  return (
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
  );
};

export default EmptyGroupState;
