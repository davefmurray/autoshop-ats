import type { Status } from '../lib/types';

const statusColors: Record<Status, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  PHONE_SCREEN: 'bg-purple-100 text-purple-800',
  IN_PERSON_1: 'bg-indigo-100 text-indigo-800',
  IN_PERSON_2: 'bg-indigo-200 text-indigo-900',
  TECH_TEST: 'bg-cyan-100 text-cyan-800',
  OFFER_SENT: 'bg-orange-100 text-orange-800',
  OFFER_ACCEPTED: 'bg-lime-100 text-lime-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<Status, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  PHONE_SCREEN: 'Phone Screen',
  IN_PERSON_1: 'In-Person 1',
  IN_PERSON_2: 'In-Person 2',
  TECH_TEST: 'Tech Test',
  OFFER_SENT: 'Offer Sent',
  OFFER_ACCEPTED: 'Offer Accepted',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${statusColors[status]} \${className}\`}
    >
      {statusLabels[status]}
    </span>
  );
}
