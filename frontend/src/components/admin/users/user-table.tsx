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
import { MoreHorizontal, ArrowUp, ArrowDown, Search, Trash2 } from 'lucide-react'; // Importamos Trash2
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/utils/api';

interface UserTableProps {
  initialUsers: User[];
  currentProject: string;
  onUpdate?: () => void;
}

const roleOptions: UserRole[] = ['Admin', 'Editor', 'Viewer'];

const roleBadgeVariants: Record<UserRole, 'destructive' | 'default' | 'secondary'> = {
  Admin: 'destructive',
  Editor: 'default',
  Viewer: 'secondary',
};

type SortableKeys = 'name' | 'project_slug' | 'role';

export default function UserTable({ initialUsers, currentProject, onUpdate }: UserTableProps) {
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

  // --- FUNCIÓN PARA ELIMINAR USUARIO ---
  // Dentro de handleDeleteUser en UserTable.tsx
const handleDeleteUser = async (user: User) => {
  if (!confirm(`¿Eliminar a ${user.name}?`)) return;

  setIsUpdating(user.id);

  try {
    // NOTA: No pongas /api aquí, fetchApi ya debería ponerlo. 
    // Asegúrate de que el path coincida con el del backend.
    const path = `/profiles/${user.id}`; 
    console.log("🗑️ Intentando borrar en:", path);

    await fetchApi(path, {
      method: 'DELETE',
    });

    toast({ title: "Eliminado", description: "Usuario borrado con éxito" });
    if (onUpdate) onUpdate();
  } catch (error: any) {
    console.error("🔴 Error detallado:", error);
    toast({ variant: "destructive", title: "Error", description: error.message });
  } finally {
    setIsUpdating(null);
  }
};

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate || userToUpdate.role === newRole) return;

    setIsUpdating(userId);
    setUsers((current) => current.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    try {
      await fetchApi(`/profiles/${userId}/role`, {
        method: 'PATCH',
        body: { role: newRole } as any,
      });

      toast({ title: "¡Actualizado!", description: `Rol cambiado a ${newRole}` });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      setUsers(initialUsers);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsUpdating(null);
    }
  };

  const requestSort = (key: SortableKeys) => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') order = 'desc';
    setSortConfig({ key, order });
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      const valA = (a[sortConfig.key] || '').toLowerCase();
      const valB = (b[sortConfig.key] || '').toLowerCase();
      return sortConfig.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return filtered;
  }, [users, searchTerm, sortConfig]);

  return (
    <Card className="border-slate-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Directorio de Usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>

        <div className="rounded-md border border-slate-100">
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
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url?.replace("http://", "https://")} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">{user.project_slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariants[user.role]} className="text-[10px] font-bold">{user.role}</Badge>
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
                        
                        {/* OPCIÓN DE ELIMINAR */}
                        <DropdownMenuItem 
                          className="text-xs text-destructive focus:text-destructive cursor-pointer"
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