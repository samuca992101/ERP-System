import { useGetAlerts, getGetAlertsQueryKey } from "@workspace/api-client-react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, TrendingUp, PackageX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TIPO_ALERTA: Record<string, string> = {
  critical_stock: "Estoque Crítico",
  high_demand: "Alta Demanda",
  idle_product: "Produto Parado",
  restock_needed: "Reposição Necessária",
};

const SEVERIDADE_PT: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

export default function Alerts() {
  const { data: alerts, isLoading } = useGetAlerts({ query: { queryKey: getGetAlertsQueryKey() } });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
      case "high": return "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "medium": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "low": return "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default: return "border-border bg-background text-foreground";
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    const className = "h-5 w-5";
    switch (type) {
      case "critical_stock": return <PackageX className={`${className} ${severity === 'critical' ? 'text-red-500' : ''}`} />;
      case "high_demand": return <TrendingUp className={`${className} text-orange-500`} />;
      case "idle_product": return <AlertCircle className={`${className} text-blue-500`} />;
      case "restock_needed": return <AlertTriangle className={`${className} text-yellow-500`} />;
      default: return <Bell className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alertas Inteligentes</h2>
        <p className="text-muted-foreground">Alertas automáticos que precisam da sua atenção.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : alerts?.length === 0 ? (
          <Card className="col-span-full border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4 opacity-80" />
              <CardTitle className="mb-2">Tudo em Ordem!</CardTitle>
              <CardDescription>
                Seu estoque e vendas estão em ordem. Nenhum alerta para exibir.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          alerts?.map((alert) => (
            <Card key={alert.id} className={`overflow-hidden border-l-4 ${getSeverityStyles(alert.severity).split(' ')[0]}`}>
              <div className={`p-4 ${getSeverityStyles(alert.severity).split(' ').slice(1).join(' ')} flex items-start gap-4`}>
                <div className="mt-0.5 bg-background/50 p-2 rounded-full backdrop-blur-sm shadow-sm">
                  {getAlertIcon(alert.type, alert.severity)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-wider">
                      {TIPO_ALERTA[alert.type] ?? alert.type}
                    </p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background/50 shadow-sm">
                      {SEVERIDADE_PT[alert.severity] ?? alert.severity}
                    </span>
                  </div>
                  <h4 className="font-medium text-base text-foreground">{alert.productName}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
