import React from 'react';
import { AnimatePresence } from 'framer-motion';
import QueueRow from './QueueRow';
import EmptyState from './EmptyState';
import { Users } from 'lucide-react';

export default function QueueList({
  waitingTokens = [],
  onSkip,
  onCancel,
  processingId = null,
}) {
  if (waitingTokens.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No customers waiting"
        description="The queue is currently empty. Enjoy the quiet moment or add a walk-in."
      />
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {waitingTokens.map((token) => (
          <QueueRow
            key={token._id}
            token={token}
            onSkip={onSkip}
            onCancel={onCancel}
            isProcessing={processingId === token._id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

