import React, { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Phone, UserPlus } from 'lucide-react';

export default function WalkInModal({
  isOpen,
  onClose,
  onSubmit,
  serviceName = 'Selected Service',
}) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter a valid customer name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
      setError('If provided, phone must be a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({ customerName: trimmedName, phone: trimmedPhone });
      setCustomerName('');
      setPhone('');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to add walk-in customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Walk-in Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-ink-muted leading-relaxed">
          Adding customer directly to <span className="font-semibold text-ink">{serviceName}</span>.
          Walk-ins bypass online limits and join the queue at the end.
        </p>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-200 text-rose-900 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          id="walkin-name"
          label="Customer Name"
          required
          autoFocus
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. Ramesh Kumar"
          icon={User}
        />

        <Input
          id="walkin-phone"
          label="Phone Number (Optional)"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ''));
            if (error) setError('');
          }}
          placeholder="10-digit mobile number"
          icon={Phone}
        />

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !customerName.trim()}
            icon={UserPlus}
            className="flex-1"
          >
            Add to Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
