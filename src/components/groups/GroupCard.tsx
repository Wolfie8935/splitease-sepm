
import React from 'react';
import { Link } from 'react-router-dom';
import { Group } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface GroupCardProps {
  group: Group;
  currentUserId: string | undefined;
  onDeleteClick: (groupId: string, e: React.MouseEvent) => void;
}

const GroupCard = ({ group, currentUserId, onDeleteClick }: GroupCardProps) => {
  return (
    <Link key={group.id} to={`/groups/${group.id}`}>
      <Card className="h-full cursor-pointer hover:shadow-md transition-shadow relative">
        {currentUserId === group.createdBy && (
          <div 
            className="absolute top-3 right-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/groups/${group.id}/edit`} onClick={(e) => e.stopPropagation()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Group
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => onDeleteClick(group.id, e)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <CardHeader>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>{group.members.length} members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {group.members.slice(0, 3).map((member) => (
                <div 
                  key={member.id} 
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-background"
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              
              {group.members.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-background">
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
  );
};

export default GroupCard;
