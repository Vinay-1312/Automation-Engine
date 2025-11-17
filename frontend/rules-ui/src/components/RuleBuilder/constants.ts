export interface ZenOperator {
  value: string;
  label: string;
  symbol: string;
  expression: string;
  friendlyName: string;
  description: string;
  example: string;
  category: string;
  icon: string;
}

export interface Tool {
  value: string;
  label: string;
  icon: string;
}

export interface Event {
  id: number;
  name: string;
  icon: string;
}

export interface InputField {
  field: string;
  name: string;
  type: string;
  icon: string;
}

export const ZEN_OPERATORS: ZenOperator[] = [
  // ... copy all ZEN_OPERATORS from EnhancedRuleBuilder.tsx
];

export const AVAILABLE_TOOLS: Tool[] = [
  { value: 'create_task', label: 'Create Task', icon: '📋' }
];

export const AVAILABLE_EVENTS: Event[] = [
  { id: 1, name: 'New Assignment Received', icon: '📋' }
];

export const AVAILABLE_INPUT_FIELDS: InputField[] = [
  { field: 'claim', name: 'Claim ID', type: 'string', icon: '🆔' },
  { field: 'user.age', name: 'User Age', type: 'number', icon: '🎂' },
  // ... add other fields
];