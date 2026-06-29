import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import Modal from '@/components/organisms/Modal';
import Toast from '@/components/molecules/Toast';

export default function AdminUserManagement() {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const users = [
    {
      id: '1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'Candidate',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Bob Recruiter',
      email: 'recruiter@hiresense.ai',
      role: 'Recruiter',
      status: 'Active',
    },
    { id: '3', name: 'System Admin', email: 'admin@hiresense.ai', role: 'Admin', status: 'Active' },
  ];

  const handleEditClick = (u: any) => {
    setSelectedUser(u);
    setShowModal(true);
  };

  const handleSaveChanges = () => {
    setShowModal(false);
    setShowToast(true);
  };

  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            message="User role parameters updated successfully!"
            onClose={() => setShowToast(false)}
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          User Management
        </h1>
        <p className="text-muted-foreground text-sm">
          View platform users list, adjust account roles, and set access parameters.
        </p>
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <Input
          placeholder="Filter by account name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Account</TableHead>
            <TableHead>System Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div>
                  <p className="font-semibold text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <Badge variant="success">{u.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleEditClick(u)}
                >
                  Adjust Role
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Adjust Account Scope"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChanges}>
              Save Configuration
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adjust system authorization scope for **{selectedUser?.name}** ({selectedUser?.email}).
          </p>
          <Input label="Access Role Override" defaultValue={selectedUser?.role} />
        </div>
      </Modal>
    </div>
  );
}
