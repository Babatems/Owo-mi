export type DefaultCategory = {
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'transfer'
  children?: Omit<DefaultCategory, 'children'>[]
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Income',
    icon: '💰',
    color: '#10B981',
    type: 'income',
    children: [
      { name: 'Employment Income', icon: '💼', color: '#10B981', type: 'income' },
      { name: 'Self-Employment', icon: '🏢', color: '#10B981', type: 'income' },
      { name: 'Investment Income', icon: '📈', color: '#10B981', type: 'income' },
      { name: 'Government Benefits', icon: '🏛️', color: '#10B981', type: 'income' },
      { name: 'Rental Income', icon: '🏠', color: '#10B981', type: 'income' },
    ],
  },
  {
    name: 'Housing',
    icon: '🏠',
    color: '#6366F1',
    type: 'expense',
    children: [
      { name: 'Rent / Mortgage', icon: '🏠', color: '#6366F1', type: 'expense' },
      { name: 'Utilities', icon: '💡', color: '#6366F1', type: 'expense' },
      { name: 'Property Tax', icon: '📋', color: '#6366F1', type: 'expense' },
      { name: 'Maintenance & Repairs', icon: '🔧', color: '#6366F1', type: 'expense' },
      { name: 'Home Insurance', icon: '🛡️', color: '#6366F1', type: 'expense' },
    ],
  },
  {
    name: 'Transportation',
    icon: '🚗',
    color: '#F59E0B',
    type: 'expense',
    children: [
      { name: 'Fuel', icon: '⛽', color: '#F59E0B', type: 'expense' },
      { name: 'Transit Pass', icon: '🚌', color: '#F59E0B', type: 'expense' },
      { name: 'Car Insurance', icon: '🛡️', color: '#F59E0B', type: 'expense' },
      { name: 'Maintenance', icon: '🔧', color: '#F59E0B', type: 'expense' },
      { name: 'Parking', icon: '🅿️', color: '#F59E0B', type: 'expense' },
    ],
  },
  {
    name: 'Food',
    icon: '🛒',
    color: '#EF4444',
    type: 'expense',
    children: [
      { name: 'Groceries', icon: '🛒', color: '#EF4444', type: 'expense' },
      { name: 'Dining Out', icon: '🍽️', color: '#EF4444', type: 'expense' },
      { name: 'Coffee', icon: '☕', color: '#EF4444', type: 'expense' },
    ],
  },
  {
    name: 'Health',
    icon: '❤️',
    color: '#EC4899',
    type: 'expense',
    children: [
      { name: 'Prescriptions', icon: '💊', color: '#EC4899', type: 'expense' },
      { name: 'Dental', icon: '🦷', color: '#EC4899', type: 'expense' },
      { name: 'Vision', icon: '👁️', color: '#EC4899', type: 'expense' },
      { name: 'Gym & Fitness', icon: '🏋️', color: '#EC4899', type: 'expense' },
    ],
  },
  {
    name: 'Registered Accounts',
    icon: '🇨🇦',
    color: '#8B5CF6',
    type: 'expense',
    children: [
      { name: 'TFSA Contribution', icon: '💰', color: '#8B5CF6', type: 'expense' },
      { name: 'RRSP Contribution', icon: '💰', color: '#8B5CF6', type: 'expense' },
      { name: 'FHSA Contribution', icon: '🏡', color: '#8B5CF6', type: 'expense' },
      { name: 'RESP Contribution', icon: '🎓', color: '#8B5CF6', type: 'expense' },
    ],
  },
  {
    name: 'Financial',
    icon: '🏦',
    color: '#64748B',
    type: 'expense',
    children: [
      { name: 'Credit Card Payment', icon: '💳', color: '#64748B', type: 'expense' },
      { name: 'Loan Payment', icon: '📝', color: '#64748B', type: 'expense' },
      { name: 'Bank Fees', icon: '🏦', color: '#64748B', type: 'expense' },
    ],
  },
  {
    name: 'Shopping',
    icon: '🛍️',
    color: '#F97316',
    type: 'expense',
    children: [
      { name: 'Clothing', icon: '👕', color: '#F97316', type: 'expense' },
      { name: 'Electronics', icon: '💻', color: '#F97316', type: 'expense' },
      { name: 'Personal Care', icon: '🧴', color: '#F97316', type: 'expense' },
      { name: 'Home Goods', icon: '🏠', color: '#F97316', type: 'expense' },
    ],
  },
  {
    name: 'Entertainment',
    icon: '🎬',
    color: '#06B6D4',
    type: 'expense',
    children: [
      { name: 'Streaming Services', icon: '📺', color: '#06B6D4', type: 'expense' },
      { name: 'Events & Concerts', icon: '🎵', color: '#06B6D4', type: 'expense' },
      { name: 'Hobbies', icon: '🎨', color: '#06B6D4', type: 'expense' },
    ],
  },
  {
    name: 'Education',
    icon: '🎓',
    color: '#84CC16',
    type: 'expense',
    children: [
      { name: 'Tuition', icon: '🎓', color: '#84CC16', type: 'expense' },
      { name: 'Books', icon: '📚', color: '#84CC16', type: 'expense' },
      { name: 'Courses', icon: '💻', color: '#84CC16', type: 'expense' },
    ],
  },
  {
    name: 'Transfers',
    icon: '↔️',
    color: '#94A3B8',
    type: 'transfer',
  },
]
