import { useGetAllForecasts, getGetAllForecastsQueryKey } from "@workspace/api-client-react";
import { Brain, TrendingUp, TrendingDown, Minus, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const TREND_LABELS: Record<string, string> = {
  up: "Alta",
  down: "Baixa",
  stable: "Estável",
};

export default function Forecast() {
  const { data: forecasts, isLoading } = useGetAllForecasts({ query: { queryKey: getGetAllForecastsQueryKey() } });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-emerald-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Previsão de Demanda com IA
          </h2>
          <p className="text-muted-foreground mt-1">
            Previsões inteligentes para suas necessidades de estoque com base no histórico de vendas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 my-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-2 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : forecasts?.length === 0 ? (
          <div className="col-span-full py-12 text-center border rounded-xl bg-background/50">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhuma Previsão Disponível</h3>
            <p className="text-muted-foreground">Dados insuficientes para gerar previsões confiáveis ainda.</p>
          </div>
        ) : (
          forecasts?.map((forecast) => (
            <Card
              key={forecast.productId}
              className={`overflow-hidden transition-all hover:shadow-md ${forecast.suggestedPurchase > 0 ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate pr-2" title={forecast.productName}>
                    {forecast.productName}
                  </CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                    {getTrendIcon(forecast.trend)}
                    <span>{TREND_LABELS[forecast.trend] ?? forecast.trend}</span>
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Package className="h-3.5 w-3.5" />
                  Estoque: <span className="font-medium text-foreground">{forecast.currentStock}</span> / Mín: {forecast.minimumStock}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="bg-background rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Amanhã</p>
                    <p className="text-2xl font-bold text-primary">{forecast.forecastQuantity}</p>
                    <p className="text-xs text-muted-foreground">unidades previstas</p>
                  </div>
                  <div className={`rounded-lg border p-3 ${forecast.suggestedPurchase > 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${forecast.suggestedPurchase > 0 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      Sugestão de Compra
                    </p>
                    <p className="text-2xl font-bold">{forecast.suggestedPurchase}</p>
                    <p className={`text-xs ${forecast.suggestedPurchase > 0 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>unidades</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Confiança da IA</span>
                    <span>{forecast.confidence}%</span>
                  </div>
                  <Progress
                    value={forecast.confidence}
                    className="h-1.5"
                    indicatorClassName={getConfidenceColor(forecast.confidence)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
