import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There is currently nothing to display.',
  action = null,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white/60">
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

