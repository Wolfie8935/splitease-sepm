
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddExpenseFormProps {
  groupId: string;
  onSuccess: () => void;
  members: {
    id: string;
    name: string;
    email: string;
  }[];
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ groupId, onSuccess, members }) => {
  const { currentUser } = useAuth();
  const { addExpense, isLoading } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(currentUser?.id || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ userId: string; amount: number }[]>([]);
  const [error, setError] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
      
      if (splitType === 'custom' && value) {
        // Reset custom splits when amount changes
        const amountValue = parseFloat(value);
        const equalSplitAmount = amountValue / members.length;
        setCustomSplits(
          members.map(member => ({
            userId: member.id,
            amount: parseFloat(equalSplitAmount.toFixed(2)),
          }))
        );
      }
    }
  };

  const handleSplitTypeChange = (value: string) => {
    const newSplitType = value as 'equal' | 'custom';
    setSplitType(newSplitType);
    
    if (newSplitType === 'custom' && amount) {
      const amountValue = parseFloat(amount);
      const equalSplitAmount = amountValue / members.length;
      setCustomSplits(
        members.map(member => ({
          userId: member.id,
          amount: parseFloat(equalSplitAmount.toFixed(2)),
        }))
      );
    }
  };

  const handleCustomSplitChange = (userId: string, value: string) => {
    const newAmount = value === '' ? 0 : parseFloat(value);
    setCustomSplits(prevSplits => 
      prevSplits.map(split => 
        split.userId === userId ? { ...split, amount: newAmount } : split
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description) {
      setError('Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!paidById) {
      setError('Please select who paid');
      return;
    }

    try {
      await addExpense(
        groupId,
        description,
        parseFloat(amount),
        paidById,
        splitType,
        splitType === 'custom' ? customSplits : undefined
      );
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  const totalCustomSplit = customSplits.reduce((sum, split) => sum + split.amount, 0);
  const amountValue = amount ? parseFloat(amount) : 0;
  const customSplitError = 
    splitType === 'custom' && 
    Math.abs(totalCustomSplit - amountValue) > 0.01;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="e.g., Dinner, Groceries, Rent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          placeholder="0.00"
          value={amount}
          onChange={handleAmountChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paidBy">Paid by</Label>
        <Select value={paidById} onValueChange={setPaidById}>
          <SelectTrigger>
            <SelectValue placeholder="Select who paid" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} {member.id === currentUser?.id ? '(you)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Split type</Label>
        <RadioGroup value={splitType} onValueChange={handleSplitTypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="equal" id="equal" />
            <Label htmlFor="equal">Split equally</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Custom split</Label>
          </div>
        </RadioGroup>
      </div>
      
      {splitType === 'custom' && (
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex justify-between items-center">
            <Label>Custom splits</Label>
            <div className={`text-sm ${customSplitError ? 'text-red-500' : 'text-muted-foreground'}`}>
              Total: ${totalCustomSplit.toFixed(2)} / ${amountValue.toFixed(2)}
            </div>
          </div>
          
          {customSplitError && (
            <div className="text-sm text-red-500">
              Custom splits must add up to the total amount
            </div>
          )}
          
          {members.map((member) => (
            <div key={member.id} className="flex items-center space-x-2">
              <div className="flex-1">
                {member.name} {member.id === currentUser?.id ? '(you)' : ''}
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={customSplits.find(split => split.userId === member.id)?.amount || ''}
                  onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || (splitType === 'custom' && customSplitError)}>
          {isLoading ? 'Adding...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
