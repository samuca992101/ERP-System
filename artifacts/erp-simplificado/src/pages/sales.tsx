import { useState } from "react";
import { 
  useListSales, 
  getListSalesQueryKey,
  useListProducts,
  getListProductsQueryKey,
  useCreateSale,
  getGetDashboardQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const saleSchema = z.object({
  productId: z.coerce.number({ required_error: "Selecione um produto" }),
  quantity: z.coerce.number().int().min(1, "Quantidade deve ser pelo menos 1"),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function Sales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sales, isLoading: isSalesLoading } = useListSales({ query: { queryKey: getListSalesQueryKey() } });
  const { data: products, isLoading: isProductsLoading } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });

  const { mutate: createSale, isPending: isCreating } = useCreateSale({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        form.reset({ productId: undefined, quantity: 1 });
        toast({ title: "Venda registrada com sucesso" });
      },
      onError: (err) => toast({ title: "Erro ao registrar venda", description: err.message, variant: "destructive" })
    }
  });

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1
    }
  });

  const selectedProductId = form.watch("productId");
  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const onSubmit = (data: SaleFormValues) => {
    createSale({ data });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vendas</h2>
        <p className="text-muted-foreground">Registre novas vendas e visualize o histórico de transações.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Venda</CardTitle>
            <CardDescription>Registre uma nova transação.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                        disabled={isProductsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (R$ {product.price.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      {selectedProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Estoque atual: {selectedProduct.currentStock} unidades
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProduct && form.watch("quantity") > 0 && (
                  <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      R$ {(selectedProduct.price * form.watch("quantity")).toFixed(2)}
                    </span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isCreating || !selectedProductId}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                  Registrar Venda
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
            <CardDescription>Registro de todas as vendas realizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSalesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[30px] ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : sales?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhuma venda registrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales?.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{sale.productName}</TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {sale.totalValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
