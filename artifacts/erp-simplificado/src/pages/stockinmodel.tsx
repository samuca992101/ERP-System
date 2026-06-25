import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // Ou seu hook de notificações

interface StockInModalProps {
  product: { id: number; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockInModal({ product, isOpen, onClose, onSuccess }: StockInModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!product || quantity <= 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/inventory/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!response.ok) throw new Error();

      toast({ title: "Sucesso!", description: `${quantity} unidades de ${product.name} adicionadas.` });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível repor o estoque." });
    } finally {
      setLoading(false);
      setQuantity(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Repor Estoque</DialogTitle>
          <DialogDescription>
            Adicionar novas unidades para: <strong>{product?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
              min={1}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processando..." : "Confirmar Entrada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}