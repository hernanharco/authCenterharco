'use client';

import * as React from 'react';
import type { User, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface UserTableProps {
  initialUsers: User[];
  currentProject: string;
}

const roleOptions: UserRole[] = ['Admin', 'Editor', 'Viewer'];

const roleBadgeVariants: Record<UserRole, 'destructive' | 'default' | 'secondary'> = {
  Admin: 'destructive',
  Editor: 'default',
  Viewer: 'secondary',
};

type SortableKeys = 'name' | 'project_slug' | 'role';

export default function UserTable({ initialUsers, currentProject }: UserTableProps) {

  console.log("Initial users:", initialUsers);
  console.log("Current project:", currentProject);

  const [users, setUsers] = React.useState(initialUsers);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const originalUsers = [...users];
    const userToUpdate = users.find((user) => user.id === userId);
    if (!userToUpdate || userToUpdate.role === newRole) return;

    setIsUpdating(userId);

    // Optimistic update
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast({
        title: 'Success!',
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (error) {
      // Revert on failure
      setUsers(originalUsers);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update user role. Please try again.',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const requestSort = (key: SortableKeys) => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    let filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredUsers.sort((a, b) => {
      const valA = a[sortConfig.key].toLowerCase();
      const valB = b[sortConfig.key].toLowerCase();

      if (sortConfig.order === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });

    console.log("Filtered users:", filteredUsers);

    return filteredUsers;
  }, [users, searchTerm, sortConfig]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">
                    Profile
                    {sortConfig.key === 'name' && (sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 text-muted-foreground" /> : <ArrowDown className="h-3 w-3 text-muted-foreground" />)}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('project_slug')}>
                  <div className="flex items-center gap-2">
                    Project
                    {sortConfig.key === 'project_slug' && (sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 text-muted-foreground" /> : <ArrowDown className="h-3 w-3 text-muted-foreground" />)}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('role')}>
                  <div className="flex items-center gap-2">
                    Role
                    {sortConfig.key === 'role' && (sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 text-muted-foreground" /> : <ArrowDown className="h-3 w-3 text-muted-foreground" />)}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id} className="transition-colors duration-300">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={(user.avatar_url || user.picture)?.replace("http://", "https://")}
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {( user.name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{user.project_slug}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariants[user.role]} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuRadioGroup
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        >
                          {roleOptions.map((role) => (
                            <DropdownMenuRadioItem key={role} value={role}>
                              {role}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}