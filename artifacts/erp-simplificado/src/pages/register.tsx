import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, Loader2 } from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { mutate: registerMutation, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Falha no cadastro",
          description: error.data?.error || "Ocorreu um erro durante o cadastro.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-xl shadow-lg border">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-2">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Comece a usar o ERP Inteligente Simplificado
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="nome@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
