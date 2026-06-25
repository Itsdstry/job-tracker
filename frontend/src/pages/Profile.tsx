import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatDate, getInitials } from '../utils';

export const Profile = () => {
  const { updateUser } = useAuth();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  });

  const [nameForm, setNameForm] = useState({ name: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updated) => {
      updateUser(updated);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
      setNameForm({ name: '' });
      setPwForm({ currentPassword: '', newPassword: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile overview */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xl font-bold">
            {profile ? getInitials(profile.name) : '?'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{profile?.email}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Member since {profile ? formatDate(profile.createdAt) : '—'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {profile?._count?.applications ?? 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Applications</p>
          </div>
        </div>
      </Card>

      {/* Update name */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Update Name</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nameForm.name) updateMutation.mutate({ name: nameForm.name });
          }}
          className="space-y-4"
        >
          <Input
            label="New Name"
            placeholder={profile?.name}
            value={nameForm.name}
            onChange={(e) => setNameForm({ name: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={updateMutation.isPending} disabled={!nameForm.name}>
              Save Name
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Change Password</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwForm.currentPassword && pwForm.newPassword) {
              updateMutation.mutate(pwForm);
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Current Password"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            hint="At least 8 characters"
            autoComplete="new-password"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={!pwForm.currentPassword || !pwForm.newPassword}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
