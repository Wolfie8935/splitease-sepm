import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  splits: {
    userId: string;
    amount: number;
  }[];
}

export interface Group {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
  }[];
  createdBy: string;
  createdAt: string;
}

export interface Balance {
  userId: string;
  userName: string;
  amount: number;
}

interface DataContextType {
  groups: Group[];
  expenses: Expense[];
  createGroup: (name: string, memberEmails: string[]) => Promise<Group>;
  addMemberToGroup: (groupId: string, memberEmail: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<void>;
  addExpense: (
    groupId: string, 
    description: string, 
    amount: number, 
    paidById: string, 
    splitType: 'equal' | 'custom', 
    customSplits?: { userId: string; amount: number }[]
  ) => Promise<Expense>;
  getGroupBalances: (groupId: string) => Balance[];
  getUserTotalBalance: () => number;
  getUserGroups: () => Group[];
  getGroupById: (groupId: string) => Group | undefined;
  getGroupExpenses: (groupId: string) => Expense[];
  getTotalSpent: () => number;
  isLoading: boolean;
  deleteGroup: (groupId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setGroups([]);
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    const fetchUserGroups = async () => {
      setIsLoading(true);
      try {
        const { data: memberships, error: membershipError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUser.id);

        if (membershipError) throw membershipError;

        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .in('id', groupIds);

          if (groupsError) throw groupsError;

          if (groupsData) {
            const fetchedGroups: Group[] = [];
            
            for (const group of groupsData) {
              const { data: groupMembers, error: membersError } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', group.id);

              if (membersError) throw membersError;

              if (groupMembers) {
                const memberIds = groupMembers.map(m => m.user_id);
                
                const { data: profiles, error: profilesError } = await supabase
                  .from('profiles')
                  .select('*')
                  .in('id', memberIds);

                if (profilesError) throw profilesError;

                fetchedGroups.push({
                  id: group.id,
                  name: group.name,
                  createdBy: group.created_by,
                  createdAt: group.created_at,
                  members: profiles ? profiles.map(p => ({
                    id: p.id,
                    name: p.name,
                    email: p.email
                  })) : []
                });
              }
            }
            
            setGroups(fetchedGroups);
            
            const { data: expensesData, error: expensesError } = await supabase
              .from('expenses')
              .select('*')
              .in('group_id', groupIds);

            if (expensesError) throw expensesError;

            if (expensesData) {
              const fetchedExpenses: Expense[] = [];
              
              for (const expense of expensesData) {
                const { data: splitsData, error: splitsError } = await supabase
                  .from('expense_splits')
                  .select('*')
                  .eq('expense_id', expense.id);

                if (splitsError) throw splitsError;

                fetchedExpenses.push({
                  id: expense.id,
                  groupId: expense.group_id,
                  description: expense.description,
                  amount: expense.amount,
                  paidBy: expense.paid_by,
                  date: expense.date,
                  splits: splitsData ? splitsData.map(split => ({
                    userId: split.user_id,
                    amount: split.amount
                  })) : []
                });
              }
              
              setExpenses(fetchedExpenses);
            }
          }
        } else {
          setGroups([]);
          setExpenses([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load your groups and expenses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserGroups();
  }, [currentUser, toast]);

  const getUserGroups = () => {
    if (!currentUser) return [];
    return groups;
  };

  const getGroupById = (groupId: string) => {
    return groups.find(group => group.id === groupId);
  };

  const getGroupExpenses = (groupId: string) => {
    return expenses.filter(expense => expense.groupId === groupId);
  };

  const createGroup = async (name: string, memberEmails: string[]): Promise<Group> => {
    if (!currentUser) throw new Error("You must be logged in to create a group");
    
    setIsLoading(true);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (groupError) throw groupError;
      if (!groupData) throw new Error("Failed to create group");

      const groupId = groupData.id;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: currentUser.id
        });

      if (memberError) throw memberError;

      const uniqueEmails = [...new Set(memberEmails.filter(email => email.trim() !== ''))];
      
      if (uniqueEmails.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('email', uniqueEmails);

        if (profilesError) throw profilesError;

        if (profiles && profiles.length > 0) {
          const members = profiles.map(profile => ({
            group_id: groupId,
            user_id: profile.id
          }));

          const { error: addMembersError } = await supabase
            .from('group_members')
            .insert(members);

          if (addMembersError) throw addMembersError;
        }
      }

      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      let members: { id: string; name: string; email: string }[] = [];
      
      if (groupMembers && groupMembers.length > 0) {
        const memberIds = groupMembers.map(m => m.user_id);
        
        const { data: memberProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', memberIds);

        if (profilesError) throw profilesError;

        if (memberProfiles) {
          members = memberProfiles.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email
          }));
        }
      }

      const newGroup: Group = {
        id: groupId,
        name,
        members,
        createdBy: currentUser.id,
        createdAt: groupData.created_at,
      };
      
      setGroups(prevGroups => [...prevGroups, newGroup]);
      
      toast({
        title: "Group created",
        description: `Successfully created group "${name}"`,
      });
      
      return newGroup;
    } catch (error) {
      toast({
        title: "Failed to create group",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addMemberToGroup = async (groupId: string, memberEmail: string) => {
    if (!currentUser) throw new Error("You must be logged in to add members");
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.members.some(member => member.email.toLowerCase() === memberEmail.toLowerCase())) {
      throw new Error("This person is already a member of the group");
    }
    
    setIsLoading(true);
    try {
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', memberEmail);

      if (profileError) throw profileError;
      
      if (!userProfiles || userProfiles.length === 0) {
        throw new Error("User not found. They need to register first.");
      }
      
      const userToAdd = userProfiles[0];
      
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userToAdd.id
        });

      if (memberError) throw memberError;
      
      const newMember = {
        id: userToAdd.id,
        name: userToAdd.name,
        email: memberEmail,
      };
      
      const updatedGroups = groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: [...g.members, newMember]
          };
        }
        return g;
      });
      
      setGroups(updatedGroups);
      
      toast({
        title: "Member added",
        description: `Successfully added ${newMember.name} to the group`,
      });
    } catch (error) {
      toast({
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberId: string): Promise<void> => {
    if (!currentUser) throw new Error("You must be logged in to remove a member");
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.createdBy !== currentUser.id) {
      throw new Error("Only the group creator can remove members");
    }
    
    if (memberId === group.createdBy) {
      throw new Error("Cannot remove the group creator");
    }
    
    setIsLoading(true);
    try {
      // Delete the member from the group_members table
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      if (error) throw error;
      
      // Update local state
      setGroups(prevGroups => prevGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== memberId)
          };
        }
        return g;
      }));
      
      toast({
        title: "Member removed",
        description: "Member has been removed from the group",
      });
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (
    groupId: string, 
    description: string, 
    amount: number, 
    paidById: string, 
    splitType: 'equal' | 'custom', 
    customSplits?: { userId: string; amount: number }[]
  ): Promise<Expense> => {
    if (!currentUser) throw new Error("You must be logged in to add an expense");
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    setIsLoading(true);
    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          description,
          amount,
          paid_by: paidById,
          date: new Date().toISOString()
        })
        .select()
        .single();

      if (expenseError) throw expenseError;
      if (!expenseData) throw new Error("Failed to create expense");

      let splits;
      
      if (splitType === 'equal') {
        const splitAmount = amount / group.members.length;
        splits = group.members.map(member => ({
          expense_id: expenseData.id,
          user_id: member.id,
          amount: parseFloat(splitAmount.toFixed(2)),
        }));
      } else if (splitType === 'custom' && customSplits) {
        const totalSplit = customSplits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - amount) > 0.01) {
          throw new Error("Custom splits must add up to the total amount");
        }
        splits = customSplits.map(split => ({
          expense_id: expenseData.id,
          user_id: split.userId,
          amount: split.amount,
        }));
      } else {
        throw new Error("Invalid split type or missing custom splits");
      }
      
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) throw splitsError;
      
      const newExpense: Expense = {
        id: expenseData.id,
        groupId,
        description,
        amount,
        paidBy: paidById,
        date: expenseData.date,
        splits: splitType === 'equal' 
          ? group.members.map(member => ({
              userId: member.id,
              amount: parseFloat((amount / group.members.length).toFixed(2)),
            }))
          : (customSplits || []),
      };
      
      setExpenses(prevExpenses => [...prevExpenses, newExpense]);
      
      toast({
        title: "Expense added",
        description: `Successfully added expense "${description}" for $${amount.toFixed(2)}`,
      });
      
      return newExpense;
    } catch (error) {
      toast({
        title: "Failed to add expense",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupBalances = (groupId: string): Balance[] => {
    if (!currentUser) return [];
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    
    const balances: Record<string, Balance> = {};
    group.members.forEach(member => {
      balances[member.id] = {
        userId: member.id,
        userName: member.name,
        amount: 0,
      };
    });
    
    groupExpenses.forEach(expense => {
      balances[expense.paidBy].amount += expense.amount;
      
      expense.splits.forEach(split => {
        balances[split.userId].amount -= split.amount;
      });
    });
    
    return Object.values(balances);
  };

  const getUserTotalBalance = (): number => {
    if (!currentUser) return 0;
    
    let totalBalance = 0;
    
    getUserGroups().forEach(group => {
      const balances = getGroupBalances(group.id);
      const userBalance = balances.find(b => b.userId === currentUser.id);
      if (userBalance) {
        totalBalance += userBalance.amount;
      }
    });
    
    return totalBalance;
  };

  const getTotalSpent = (): number => {
    if (!currentUser) return 0;
    
    const userExpenses = expenses.filter(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      return group && group.members.some(member => member.id === currentUser.id);
    });
    
    const total = userExpenses.reduce((sum, expense) => {
      const userSplit = expense.splits.find(split => split.userId === currentUser.id);
      return sum + (userSplit?.amount || 0);
    }, 0);
    
    return total;
  };

  const deleteGroup = async (groupId: string): Promise<void> => {
    if (!currentUser) throw new Error("You must be logged in to delete a group");
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.createdBy !== currentUser.id) {
      throw new Error("Only the group creator can delete this group");
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      
      setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      
      setExpenses(prevExpenses => prevExpenses.filter(e => e.groupId !== groupId));
      
    } catch (error) {
      toast({
        title: "Failed to delete group",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    groups,
    expenses,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    addExpense,
    getGroupBalances,
    getUserTotalBalance,
    getUserGroups,
    getGroupById,
    getGroupExpenses,
    getTotalSpent,
    isLoading,
    deleteGroup,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
