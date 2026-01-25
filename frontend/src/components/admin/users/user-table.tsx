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
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/utils/api';
import { cn } from '@/lib/utils';

interface UserTableProps {
  initialUsers: User[];
  onUpdate?: () => void;
}

// 1. Agregamos 'Owner' a las opciones de la tabla
const roleOptions: UserRole[] = ['Owner', 'SuperAdmin', 'Admin', 'Editor', 'Viewer'];

// 2. Agregamos 'Owner' al Record para solucionar el error 2741
const roleBadgeVariants: Record<UserRole, string> = {
  Owner: 'bg-amber-600 hover:bg-amber-700 text-white border-transparent', // Dorado/Ámbar para el dueño
  SuperAdmin: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
  Admin: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  Editor: 'bg-primary text-primary-foreground hover:bg-primary/80',
  Viewer: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
};

type SortableKeys = 'name' | 'project_slug' | 'role';

export default function UserTable({ initialUsers, onUpdate }: UserTableProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; order: 'asc' | 'desc' }>({
    key: 'name',
    order: 'asc'
  });

  React.useEffect(() => {
    if (!isUpdating) {
      setUsers(initialUsers);
    }
  }, [initialUsers, isUpdating]);

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'SuperAdmin') {
      toast({ variant: "destructive", title: "Acción prohibida", description: "No se puede eliminar a un SuperAdmin." });
      return;
    }

    if (!confirm(`¿Eliminar a ${user.name}?`)) return;

    setIsUpdating(user.id);
    try {
      await fetchApi(`/profiles/${user.id}`, { method: 'DELETE' });
      toast({ title: "Eliminado", description: "Usuario borrado con éxito" });
      if (onUpdate) onUpdate();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdating(userId);
    try {
      await fetchApi(`/profiles/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      toast({ title: "¡Actualizado!", description: `Rol cambiado a ${newRole}` });
      if (onUpdate) onUpdate();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsUpdating(null);
    }
  };

  const requestSort = (key: SortableKeys) => {
    const order: 'asc' | 'desc' = sortConfig.key === key && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, order });
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      const valA = (a[sortConfig.key] as string || '').toLowerCase();
      const valB = (b[sortConfig.key] as string || '').toLowerCase();
      return sortConfig.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return filtered;
  }, [users, searchTerm, sortConfig]);

  return (
    <Card className="border-slate-200/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Directorio de Usuarios</CardTitle>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          <ShieldCheck className="w-3 h-3 mr-1" /> Control de Acceso
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>

        <div className="rounded-md border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>Perfil</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('project_slug')}>Proyecto</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('role')}>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id} className={user.role === 'SuperAdmin' ? "bg-indigo-50/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn("h-9 w-9 border-2", user.role === 'SuperAdmin' ? "border-indigo-200" : "border-transparent")}>
                        <AvatarImage src={user.avatar_url?.replace("http://", "https://")} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm flex items-center gap-1">
                          {user.name}
                          {user.role === 'SuperAdmin' && <ShieldCheck className="w-3 h-3 text-indigo-600" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">{user.project_slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] font-bold shadow-none", roleBadgeVariants[user.role])}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup
                          value={user.role}
                          onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                        >
                          {roleOptions.map((role) => (
                            <DropdownMenuRadioItem key={role} value={role} className="text-xs">
                              Cambiar a {role}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs text-destructive focus:text-destructive cursor-pointer"
                          disabled={user.role === 'SuperAdmin'}
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Eliminar Usuario
                        </DropdownMenuItem>
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