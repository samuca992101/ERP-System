import { useState } from "react";
import { 
  useListProducts, 
  getListProductsQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Search, Loader2, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  category: z.string().min(2, "Categoria é obrigatória"),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  currentStock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  minimumStock: z.coerce.number().int().min(0, "Estoque mínimo não pode ser negativo"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Estados para o Modal de Reposição de Estoque
  const [stockInProduct, setStockInProduct] = useState<any>(null);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [stockInQuantity, setStockInQuantity] = useState(1);
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "Produto criado com sucesso" });
      },
      onError: (err) => toast({ title: "Erro ao criar produto", description: err.message, variant: "destructive" })
    }
  });

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setIsEditOpen(false);
        setEditProduct(null);
        toast({ title: "Produto atualizado com sucesso" });
      },
      onError: (err) => toast({ title: "Erro ao atualizar produto", description: err.message, variant: "destructive" })
    }
  });

  const { mutate: deleteProduct } = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Produto excluído com sucesso" });
      },
      onError: (err) => toast({ title: "Erro ao excluir produto", description: err.message, variant: "destructive" })
    }
  });

  // Função para processar a Entrada de Estoque
  const handleStockIn = async () => {
    if (!stockInProduct || stockInQuantity <= 0) return;
    
    setIsSubmittingStock(true);
    try {
      const response = await fetch("/api/inventory/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: stockInProduct.id, 
          quantity: stockInQuantity 
        }),
      });

      if (!response.ok) throw new Error();

      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ 
        title: "Estoque atualizado", 
        description: `${stockInQuantity} unidades adicionadas a ${stockInProduct.name}.` 
      });
      setIsStockInOpen(false);
      setStockInQuantity(1);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Erro na reposição", 
        description: "Não foi possível atualizar o estoque." 
      });
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "", price: 0, currentStock: 0, minimumStock: 0 }
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema)
  });

  const handleEditClick = (product: any) => {
    setEditProduct(product);
    editForm.reset({
      name: product.name,
      category: product.category,
      price: product.price,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
    });
    setIsEditOpen(true);
  };

  const handleStockInClick = (product: any) => {
    setStockInProduct(product);
    setStockInQuantity(1);
    setIsStockInOpen(true);
  };

  const getStockBadge = (current: number, min: number) => {
    if (current === 0) return <Badge variant="destructive">Sem Estoque</Badge>;
    if (current <= min) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Estoque Baixo</Badge>;
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Em Estoque</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">Gerencie seu catálogo e estoque.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (open) createForm.reset();
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
              <DialogDescription>Adicione um novo item ao catálogo.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createProduct({ data }))} className="space-y-4">
                <FormField control={createForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={createForm.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={createForm.control} name="currentStock" render={({ field }) => (
                    <FormItem><FormLabel>Estoque Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={createForm.control} name="minimumStock" render={({ field }) => (
                  <FormItem><FormLabel>Estoque Mínimo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Reposição de Estoque */}
      <Dialog open={isStockInOpen} onOpenChange={setIsStockInOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Repor Estoque</DialogTitle>
            <DialogDescription>
              Adicionar unidades ao produto: <span className="font-bold text-foreground">{stockInProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantidade a adicionar</Label>
              <Input 
                id="qty" 
                type="number" 
                min="1" 
                value={stockInQuantity} 
                onChange={(e) => setStockInQuantity(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockInOpen(false)}>Cancelar</Button>
            <Button onClick={handleStockIn} disabled={isSubmittingStock}>
              {isSubmittingStock && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize os detalhes do produto.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateProduct({ id: editProduct.id, data }))} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="currentStock" render={({ field }) => (
                  <FormItem><FormLabel>Estoque Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="minimumStock" render={({ field }) => (
                <FormItem><FormLabel>Estoque Mínimo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Atualizar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input 
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{product.currentStock}</TableCell>
                  <TableCell>{getStockBadge(product.currentStock, product.minimumStock)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Botão de Reposição de Estoque */}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleStockInClick(product)}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Repor Estoque"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>

                      <Button variant="outline" size="icon" onClick={() => handleEditClick(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir {product.name}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProduct({ id: product.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}