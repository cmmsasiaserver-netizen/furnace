"use client"

import { useState } from "react"
import { useMGOStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line 
} from "recharts"
import { 
  TrendingUp, TrendingDown, Package, Fuel, DollarSign, Users, Activity, Layers, Search
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function MGOPage() {
  const { records } = useMGOStore()
  const [search, setSearch] = useState("")

  // Calculations
  const filtered = records.filter(r => r.date.includes(search) || r.remarks.toLowerCase().includes(search.toLowerCase()))
  const lastRecord = records[records.length - 1]
  const totalInput = records.reduce((acc, r) => acc + r.materialInput, 0)
  const totalOutput = records.reduce((acc, r) => acc + r.materialOutput, 0)
  const avgYield = records.filter(r => r.yield > 0).reduce((acc, r) => acc + r.yield, 0) / records.filter(r => r.yield > 0).length
  const totalCost = records.reduce((acc, r) => acc + r.totalCost, 0)

  const chartData = records.filter(r => r.materialInput > 0).map(r => ({
    name: r.date.split('-').slice(1).join('/'),
    yield: r.yield,
    costKg: r.costPerKg,
    input: r.materialInput,
    output: r.materialOutput
  }))

  const statCards = [
    { label: "Total Material Input", value: `${totalInput.toLocaleString()} kg`, sub: "Monthly Gross Input", icon: Layers, color: "bg-blue-600" },
    { label: "Total Material Output", value: `${totalOutput.toLocaleString()} kg`, sub: "Net Production Yield", icon: Package, color: "bg-emerald-600" },
    { label: "Average Plant Yield", value: `${avgYield.toFixed(2)}%`, sub: "Target: 50% Min", icon: Activity, color: "bg-indigo-600" },
    { label: "Available Stone", value: `${lastRecord?.availableStone.toLocaleString()} kg`, sub: "Current Stock Level", icon: TrendingDown, color: "bg-amber-600" },
    { label: "Total Production Cost", value: `₨ ${totalCost.toLocaleString()}`, sub: "Monthly OpEx", icon: DollarSign, color: "bg-slate-800" },
    { label: "Avg Cost per kg", value: `₨ ${(totalCost / totalOutput || 0).toFixed(2)}`, sub: "Efficiency Metric", icon: TrendingUp, color: "bg-rose-600" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-6 font-sans">
      {/* Premium Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 p-10">
          <Activity className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-black mb-4">PRODUCTION MODULE v1.0</Badge>
          <h1 className="text-4xl font-black tracking-tighter">MGO Management Software</h1>
          <p className="text-slate-400 text-lg font-medium mt-2">Material Guarding & Operations Tracking — March 2026 Fleet</p>
          
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
                MGO March Production Log
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
                {filtered.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{record.date}</td>
                    <td className="py-4 font-bold text-blue-600">{record.materialInput.toLocaleString()}</td>
                    <td className="py-4 font-bold text-emerald-600">{record.materialOutput.toLocaleString()}</td>
                    <td className="py-4">
                      <Badge variant={record.yield > 50 ? "default" : "outline"} className={record.yield > 50 ? "bg-emerald-500" : ""}>
                        {record.yield.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="py-4 text-slate-500 font-medium">{record.fuelUsed.toLocaleString()} L</td>
                    <td className="py-4 text-slate-700 font-bold">₨ {record.laborCost.toLocaleString()}</td>
                    <td className="py-4 text-slate-900 font-black">₨ {record.totalCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${record.remarks === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {record.remarks}
                      </span>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
        © 2026 MGO Management Software • Financial Year 2025-26 • Asia Poultry Feeds
      </div>
    </div>
  )
}
