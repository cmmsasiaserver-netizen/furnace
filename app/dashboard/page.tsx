"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, Package, DollarSign, Activity, Layers, Search, Clock, FileText, Loader2, Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [stockBalance, setStockBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch real-time data from Supabase
  useEffect(() => {
    fetchRecords();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('production_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'production_records' },
        () => {
          fetchRecords();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch production records
      const { data: productionData, error: productionError } = await supabase
        .from('production_records')
        .select('*')
        .order('date', { ascending: true });
      
      if (productionError) throw productionError;
      
      // Fetch fuel entries
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_entries')
        .select('*');
      
      if (fuelError) throw fuelError;
      
      // Combine and transform data for dashboard format
      const combinedRecords = (productionData || []).map((record: any) => {
        const fuels = (fuelData || [])
          .filter((f: any) => f.record_id === record.id)
          .map((f: any) => ({
            id: f.id,
            fuelType: f.fuel_type,
            fuelWeight: f.fuel_weight,
            fuelCost: f.fuel_cost,
          }));
        
        const totalFuelWeight = fuels.reduce((sum: number, f: any) => sum + (f.fuelWeight || 0), 0);
        
        return {
          id: record.id,
          date: record.date,
          // Map to dashboard format
          materialInput: record.material_input || 0,
          materialOutput: record.output_after_cooking || 0,
          yield: record.yield_percentage || 0,
          labourCost: record.labour_cost || 0,
          laborCost: record.labour_cost || 0, // alias for compatibility
          totalCost: record.total_cost || 0,
          fuelUsed: totalFuelWeight, // Total fuel weight as fuel used
          fuels: fuels,
          costPerKg: record.cost_per_kg || 0,
          totalHours: record.total_hours || 0,
          batchNo: record.batch_no,
          remarks: 'ok', // Default since not in production report
        };
      });
      
      setRecords(combinedRecords);
      
      // Fetch MGCO3 stock balance
      await fetchStockBalance();
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('mgco3_stock')
        .select('stock_added, stock_consumed');
      
      if (error) throw error;
      
      const balance = (data || []).reduce((acc: number, r: any) => 
        acc + (r.stock_added || 0) - (r.stock_consumed || 0), 0
      );
      setStockBalance(balance);
    } catch (error) {
      console.error('Error fetching stock balance:', error);
    }
  };

  // Calculations
  const filtered = records.filter(r => r.date.includes(search) || r.remarks.toLowerCase().includes(search.toLowerCase()));
  const lastRecord = records[records.length - 1];
  const totalInput = records.reduce((acc, r) => acc + r.materialInput, 0);
  const totalOutput = records.reduce((acc, r) => acc + r.materialOutput, 0);
  const avgYield = records.filter(r => r.yield > 0).reduce((acc, r) => acc + r.yield, 0) / records.filter(r => r.yield > 0).length;
  const totalCost = records.reduce((acc, r) => acc + r.totalCost, 0);

  const chartData = records.filter(r => r.materialInput > 0).map(r => ({
    name: r.date.split('-').slice(1).join('/'),
    yield: r.yield,
    costKg: r.costPerKg,
    input: r.materialInput,
    output: r.materialOutput
  }));

  const statCards = [
    { label: "Total Batches", value: records.length.toString(), sub: "Production Batches", icon: FileText, color: "bg-blue-600" },
    { label: "Total Material Input", value: `${totalInput.toLocaleString()} kg`, sub: "Gross Input", icon: Layers, color: "bg-indigo-600" },
    { label: "Total Output", value: `${totalOutput.toLocaleString()} kg`, sub: "Net Production", icon: Package, color: "bg-emerald-600" },
    { label: "Average Yield", value: `${avgYield ? avgYield.toFixed(1) : 0}%`, sub: "Efficiency Rate", icon: Activity, color: "bg-amber-600" },
    { label: "Total Production Cost", value: `Rs. ${totalCost.toLocaleString()}`, sub: "Operating Expenses", icon: DollarSign, color: "bg-rose-600" },
    { label: "MGCO3 Stock", value: `${stockBalance.toFixed(0)} kg`, sub: "Available Stone", icon: Database, color: stockBalance < 100 ? "bg-rose-600" : "bg-cyan-600" },
  ];

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar activeItem="overview" />
      <div className="flex-1 bg-slate-50 p-6 flex flex-col gap-6 font-sans overflow-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 p-10">
          <Activity className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-black mb-4">PRODUCTION MODULE v1.0</Badge>
          <h1 className="text-4xl font-black tracking-tighter">MGO Management Software</h1>
          <p className="text-slate-400 text-lg font-medium mt-2">Material Guarding & Operations Tracking</p>

          <div className="flex items-center gap-6 mt-8 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Database Connected</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="h-3 w-3 rounded-full bg-blue-400" />
              <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Real-time Calculation Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-slate-600 font-medium">Loading real-time data...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-none shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={`h-14 w-14 rounded-2xl ${card.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                <card.icon className="h-7 w-7 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-2">{card.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{card.value}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{card.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-indigo-600" />
              Yield % Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 60]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="yield" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
              <DollarSign className="h-5 w-5 text-rose-600" />
              Cost per Kilogram (₨/kg)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="costKg" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Log Table */}
      <Card className="border-none shadow-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Layers className="h-6 w-6 text-blue-400" />
                MGO Production Log
              </CardTitle>
              <p className="text-slate-400 text-xs font-bold mt-1">Audit-ready production records and financial tracking</p>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by date or remarks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10 bg-white/5 border-white/20 text-white rounded-xl focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 px-6">Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Input (kg)</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Output (kg)</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Yield %</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Fuel Used</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Labor Cost</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Total Cost</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-right px-6">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span className="text-slate-500">Loading records...</span>
                    </td>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No production records found. Add records from the Production Report page.
                    </td>
                  </TableRow>
                ) : (
                  filtered.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{record.date}</td>
                    <td className="py-4 font-bold text-blue-600">{record.materialInput.toLocaleString()}</td>
                    <td className="py-4 font-bold text-emerald-600">{record.materialOutput.toLocaleString()}</td>
                    <td className="py-4">
                      <Badge variant={record.yield > 50 ? "default" : "outline"} className={record.yield > 50 ? "bg-emerald-500" : ""}>
                        {record.yield.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-4 text-slate-500 font-medium">{record.fuelUsed.toLocaleString()} kg</td>
                    <td className="py-4 text-slate-700 font-bold">Rs {record.laborCost.toLocaleString()}</td>
                    <td className="py-4 text-slate-900 font-black">Rs {record.totalCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${record.remarks === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {record.remarks}
                      </span>
                    </td>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
        © 2026 MGO Management Software • Asia Poultry Feeds
      </div>
      </div>
    </div>
  );
}
