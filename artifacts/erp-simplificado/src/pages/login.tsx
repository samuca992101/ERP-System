import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, Loader2 } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginMutation, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Falha ao entrar",
          description: error.data?.error || "Credenciais inválidas. Tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-xl shadow-lg border">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-2">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground">
            Digite suas credenciais para acessar o ERP
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
