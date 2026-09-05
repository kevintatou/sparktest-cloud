import '@testing-library/jest-dom';
jest.unmock('lucide-react');
jest.unmock('@/components/ui/button');
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateTestDialog } from '../create-test-dialog';

it('preserves the command and keeps the dialog open when saving fails', async () => {
  const onOpenChange = jest.fn();
  const onCreateTest = jest.fn().mockRejectedValue(new Error('Offline'));
  render(
    <CreateTestDialog
      open
      onOpenChange={onOpenChange}
      onCreateTest={onCreateTest}
    />
  );
  fireEvent.change(screen.getByLabelText('Definition Name *'), {
    target: { value: 'Smoke' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create Test' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Your input is preserved'
  );
  expect(screen.getByLabelText('Definition Name *')).toHaveValue('Smoke');
  expect(screen.getByLabelText('Shell command *')).toHaveValue(
    'echo "SparkTest connected"'
  );
  expect(onOpenChange).not.toHaveBeenCalled();
});

it('waits for a successful save before closing and submits a shell example', async () => {
  let finish!: () => void;
  const onCreateTest = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const onOpenChange = jest.fn();
  render(
    <CreateTestDialog
      open
      onOpenChange={onOpenChange}
      onCreateTest={onCreateTest}
    />
  );
  fireEvent.change(screen.getByLabelText('Definition Name *'), {
    target: { value: 'Smoke' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create Test' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(onCreateTest).toHaveBeenCalledWith(
    expect.objectContaining({ commands: ['echo "SparkTest connected"'] })
  );
  finish();
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});
