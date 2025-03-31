
import React from 'react';
import { Group } from '@/contexts/DataContext';
import GroupCard from './GroupCard';

interface GroupListProps {
  groups: Group[];
  currentUserId: string | undefined;
  onDeleteClick: (groupId: string, e: React.MouseEvent) => void;
}

const GroupList = ({ groups, currentUserId, onDeleteClick }: GroupListProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard 
          key={group.id} 
          group={group} 
          currentUserId={currentUserId} 
          onDeleteClick={onDeleteClick} 
        />
      ))}
    </div>
  );
};

export default GroupList;
