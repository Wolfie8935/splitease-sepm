import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from "@/components/ui/use-toast";

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
}

// Storage keys
const GROUPS_STORAGE_KEY = 'splitly_groups';
const EXPENSES_STORAGE_KEY = 'splitly_expenses';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      try {
        const storedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
        const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
        
        if (storedGroups) {
          setGroups(JSON.parse(storedGroups));
        }
        
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    } else {
      setGroups([]);
      setExpenses([]);
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [groups, expenses, currentUser]);

  const getUserGroups = () => {
    if (!currentUser) return [];
    return groups.filter(group => 
      group.members.some(member => member.id === currentUser.id)
    );
  };

  const getGroupById = (groupId: string) => {
    return groups.find(group => group.id === groupId);
  };

  const getGroupExpenses = (groupId: string) => {
    return expenses.filter(expense => expense.groupId === groupId);
  };

  const createGroup = async (name: string, memberEmails: string[]) => {
    if (!currentUser) throw new Error("You must be logged in to create a group");
    
    setIsLoading(true);
    try {
      const storedUsers = localStorage.getItem('splitly_users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      const members = Object.values(users)
        .filter((user: any) => memberEmails.includes(user.email) || user.id === currentUser.id)
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }));
      
      if (!members.some(member => member.id === currentUser.id)) {
        members.push({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        });
      }
      
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name,
        members,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
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
      const storedUsers = localStorage.getItem('splitly_users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      const userToAdd = Object.values(users).find(
        (user: any) => user.email.toLowerCase() === memberEmail.toLowerCase()
      );
      
      if (!userToAdd) {
        throw new Error("User not found. They need to register first.");
      }
      
      const newMember = {
        id: (userToAdd as any).id,
        name: (userToAdd as any).name,
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

  const addExpense = async (
    groupId: string, 
    description: string, 
    amount: number, 
    paidById: string, 
    splitType: 'equal' | 'custom', 
    customSplits?: { userId: string; amount: number }[]
  ) => {
    if (!currentUser) throw new Error("You must be logged in to add an expense");
    
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    setIsLoading(true);
    try {
      let splits;
      
      if (splitType === 'equal') {
        const splitAmount = amount / group.members.length;
        splits = group.members.map(member => ({
          userId: member.id,
          amount: parseFloat(splitAmount.toFixed(2)),
        }));
      } else if (splitType === 'custom' && customSplits) {
        const totalSplit = customSplits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - amount) > 0.01) {
          throw new Error("Custom splits must add up to the total amount");
        }
        splits = customSplits;
      } else {
        throw new Error("Invalid split type or missing custom splits");
      }
      
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        groupId,
        description,
        amount,
        paidBy: paidById,
        date: new Date().toISOString(),
        splits,
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

  const value = {
    groups,
    expenses,
    createGroup,
    addMemberToGroup,
    addExpense,
    getGroupBalances,
    getUserTotalBalance,
    getUserGroups,
    getGroupById,
    getGroupExpenses,
    getTotalSpent,
    isLoading,
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
