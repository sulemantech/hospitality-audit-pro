import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, AlertTriangle, Euro, BarChart3, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

// ── Demo financial data (Cyprus hospitality benchmarks) ──────────
const OTA_DATA = [
  { channel: "Booking.com",   commission: 15, revenue: 148200, bookings: 1240, color: "bg-blue-500" },
  { channel: "Airbnb",        commission: 3,  revenue: 42800,  bookings: 312,  color: "bg-rose-500" },
  { channel: "Expedia",       commission: 18, revenue: 31600,  bookings: 198,  color: "bg-yellow-500" },
  { channel: "TripAdvisor",   commission: 12, revenue: 18900,  bookings: 143,  color: "bg-emerald-500" },
  { channel: "Direct / Walk-in", commission: 0, revenue: 89400, bookings: 620,  color: "bg-primary" },
];

const SUPPLIERS = [
  { item: "Bed linen sets",      retail: 28.50, wholesale: 16.20, qty: 240, category: "Linen" },
  { item: "Towel sets",          retail: 14.80, wholesale: 8.90,  qty: 380, category: "Linen" },
  { item: "Shower gel (500ml)",  retail: 3.20,  wholesale: 1.45,  qty: 960, category: "Toiletries" },
  { item: "Shampoo (500ml)",     retail: 3.50,  wholesale: 1.60,  qty: 960, category: "Toiletries" },
  { item: "Coffee sachets (box)",retail: 12.40, wholesale: 6.80,  qty: 180, category: "F&B" },
  { item: "Cleaning concentrate",retail: 8.90,  wholesale: 4.20,  qty: 120, category: "Cleaning" },
];

const UTILITY_DATA = [
  { month: "Jan", electricity: 4200, water: 890,  gas: 1100 },
  { month: "Feb", electricity: 3900, water: 820,  gas: 1050 },
  { month: "Mar", electricity: 4100, water: 910,  gas: 980 },
  { month: "Apr", electricity: 5200, water: 1100, gas: 740 },
  { month: "May", electricity: 6800, water: 1380, gas: 420 },
  { month: "Jun", electricity: 9400, water: 1920, gas: 180 },
];

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const totalRevenue = OTA_DATA.reduce((s, c) => s + c.revenue, 0);
  const totalCommission = OTA_DATA.reduce((s, c) => s + (c.revenue * c.commission) / 100, 0);
  const directRevenue = OTA_DATA.find((c) => c.channel === "Direct / Walk-in")?.revenue ?? 0;
  const directPct = Math.round((directRevenue / totalRevenue) * 100);
  const maxRevenue = Math.max(...OTA_DATA.map((c) => c.revenue));

  const supplierSavings = SUPPLIERS.reduce((s, item) => {
    return s + (item.retail - item.wholesale) * item.qty;
  }, 0);

  const maxUtility = Math.max(...UTILITY_DATA.flatMap((m) => [m.electricity, m.water, m.gas]));

  return (
    <>
      <Header
        title="Financial Tracker"
        subtitle="OTA commission leakage · supplier benchmarking · utility costs"
      />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Revenue (YTD)", value: `€${(totalRevenue / 1000).toFixed(0)}K`, icon: Euro, color: "text-primary", sub: "All channels combined" },
            { label: "OTA Commissions Paid", value: `€${(totalCommission / 1000).toFixed(0)}K`, icon: TrendingDown, color: "text-red-500", sub: `${Math.round((totalCommission / totalRevenue) * 100)}% of gross revenue` },
            { label: "Direct Booking Rate", value: `${directPct}%`, icon: TrendingUp, color: "text-green-600", sub: "Zero commission revenue" },
            { label: "Procurement Savings", value: `€${(supplierSavings / 1000).toFixed(1)}K`, icon: ShoppingCart, color: "text-emerald-600", sub: "Retail vs wholesale delta" },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* OTA Commission Analysis */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">OTA Channel Revenue & Commission Leakage</CardTitle>
            <Badge variant="negative" className="text-[10px]">€{(totalCommission / 1000).toFixed(0)}K lost to commissions</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {OTA_DATA.sort((a, b) => b.revenue - a.revenue).map((row) => {
              const commissionAmount = (row.revenue * row.commission) / 100;
              const netRevenue = row.revenue - commissionAmount;
              const barW = Math.round((row.revenue / maxRevenue) * 100);
              return (
                <div key={row.channel}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{row.channel}</span>
                      {row.commission > 0 && (
                        <span className="text-red-600 font-semibold">{row.commission}% fee</span>
                      )}
                      {row.commission === 0 && (
                        <Badge variant="positive" className="text-[9px] py-0">No fee</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{row.bookings} bookings</span>
                      <span className="font-semibold text-foreground">€{row.revenue.toLocaleString()}</span>
                      {row.commission > 0 && (
                        <span className="text-red-500">-€{commissionAmount.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden bg-muted gap-0.5">
                    <div
                      className={cn("h-full transition-all", row.color)}
                      style={{ width: `${Math.round((netRevenue / maxRevenue) * 100)}%`, opacity: 0.85 }}
                      title={`Net: €${netRevenue.toFixed(0)}`}
                    />
                    {row.commission > 0 && (
                      <div
                        className="h-full bg-red-400 opacity-60"
                        style={{ width: `${Math.round((commissionAmount / maxRevenue) * 100)}%` }}
                        title={`Commission: €${commissionAmount.toFixed(0)}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2 text-[11px] text-muted-foreground border-t border-border">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary opacity-85 inline-block" /> Net revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400 opacity-60 inline-block" /> Commission lost</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Supplier benchmarking */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Supplier Price Benchmarking</CardTitle>
              <Badge variant="positive" className="text-[10px]">Save €{supplierSavings.toLocaleString()}/yr</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Item</th>
                      <th className="py-2 pr-3 text-right text-muted-foreground font-medium">Retail</th>
                      <th className="py-2 pr-3 text-right text-muted-foreground font-medium">Wholesale</th>
                      <th className="py-2 text-right text-muted-foreground font-medium">Saving/yr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {SUPPLIERS.map((item) => {
                      const saving = (item.retail - item.wholesale) * item.qty;
                      const pct = Math.round(((item.retail - item.wholesale) / item.retail) * 100);
                      return (
                        <tr key={item.item} className="hover:bg-muted/30">
                          <td className="py-2 pr-3 font-medium text-foreground">{item.item}</td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">€{item.retail.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-right text-green-600 font-semibold">€{item.wholesale.toFixed(2)}</td>
                          <td className="py-2 text-right">
                            <span className="text-emerald-600 font-bold">€{saving.toFixed(0)}</span>
                            <span className="text-muted-foreground ml-1">(-{pct}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border font-semibold">
                      <td colSpan={3} className="py-2 text-sm text-foreground">Total annual saving</td>
                      <td className="py-2 text-right text-emerald-600 text-sm">€{supplierSavings.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Utility tracker */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Utility Costs — Jan to Jun 2026</CardTitle>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3" /> Jun spike +38%
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {UTILITY_DATA.map((m) => {
                const total = m.electricity + m.water + m.gas;
                const elecW = Math.round((m.electricity / maxUtility) * 100);
                const waterW = Math.round((m.water / maxUtility) * 100);
                const gasW = Math.round((m.gas / maxUtility) * 100);
                const isSpike = m.month === "Jun";
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className={cn("font-medium", isSpike ? "text-amber-600" : "text-foreground")}>{m.month}</span>
                      <span className={cn("font-semibold", isSpike ? "text-amber-600" : "text-muted-foreground")}>
                        €{total.toLocaleString()}
                        {isSpike && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                      </span>
                    </div>
                    <div className="flex h-4 rounded overflow-hidden bg-muted gap-px">
                      <div className="bg-amber-400" style={{ width: `${elecW}%` }} title={`Electricity €${m.electricity}`} />
                      <div className="bg-blue-400" style={{ width: `${waterW}%` }} title={`Water €${m.water}`} />
                      <div className="bg-orange-400" style={{ width: `${gasW}%` }} title={`Gas €${m.gas}`} />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground border-t border-border">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> Electricity</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-400 inline-block" /> Water</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-orange-400 inline-block" /> Gas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insight callout */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Key Finding: €{(totalCommission / 1000).toFixed(0)}K/yr in OTA commissions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Booking.com alone accounts for €{((OTA_DATA[0].revenue * OTA_DATA[0].commission) / 100 / 1000).toFixed(0)}K at 15% commission.
                Increasing direct bookings by 10% would save ~€{Math.round(totalCommission * 0.1 / 1000)}K/yr.
                Consider a direct booking incentive (free breakfast, late checkout) on your own website.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
