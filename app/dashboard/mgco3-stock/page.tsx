"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Plus, Package, TrendingDown, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StockRecord {
  id: string;
  date: string;
  stockAdded: number;
  stockConsumed: number;
  balance: number;
  notes: string;
  created_at?: string;
}

export default function MGCO3StockPage() {
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [newRecord, setNewRecord] = useState<Partial<StockRecord>>({
    date: new Date().toISOString().split('T')[0],
    stockAdded: 0,
    stockConsumed: 0,
    notes: "",
  });

  // Fetch records from Supabase
  useEffect(() => {
    fetchRecords();
    fetchProductionConsumption();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mgco3_stock')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setRecords(data || []);
      
      // Calculate current balance
      const balance = (data || []).reduce((acc: number, r: StockRecord) => 
        acc + (r.stockAdded || 0) - (r.stockConsumed || 0), 0
      );
      setCurrentBalance(balance);
    } catch (error) {
      console.error('Error fetching stock records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch production consumption from production records
  const fetchProductionConsumption = async () => {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .select('date, material_input, batch_no')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Auto-create consumption records for production batches
      if (data && data.length > 0) {
        // Check if we need to add any consumption records
        const { data: existingStock, error: stockError } = await supabase
          .from('mgco3_stock')
          .select('notes')
          .like('notes', 'Auto-consumed for Batch%');
        
        if (stockError) throw stockError;
        
        const existingBatchNotes = new Set((existingStock || []).map((s: any) => s.notes));
        
        const newConsumptionRecords = data
          .filter((r: any) => !existingBatchNotes.has(`Auto-consumed for Batch ${r.batch_no}`))
          .map((r: any) => ({
            date: r.date,
            stockAdded: 0,
            stockConsumed: r.material_input,
            balance: 0, // Will be calculated
            notes: `Auto-consumed for Batch ${r.batch_no}`,
          }));
        
        if (newConsumptionRecords.length > 0) {
          // Insert consumption records
          for (const record of newConsumptionRecords) {
            await supabase.from('mgco3_stock').insert(record);
          }
          // Refresh records
          fetchRecords();
        }
      }
    } catch (error) {
      console.error('Error fetching production consumption:', error);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!newRecord.date) newErrors.push("Date is required");
    if (!newRecord.stockAdded && !newRecord.stockConsumed) {
      newErrors.push("Either Stock Added or Stock Consumed must be greater than 0");
    }
    
    // Check if we have enough balance for consumption
    if (newRecord.stockConsumed && newRecord.stockConsumed > 0) {
      if (newRecord.stockConsumed > currentBalance) {
        newErrors.push(`Insufficient stock! Available: ${currentBalance.toFixed(2)} kg`);
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleAddRecord = async () => {
    if (!validateForm()) {
      alert("Please fix errors:\n" + errors.join("\n"));
      return;
    }
    
    setSaving(true);
    
    try {
      const stockAdded = newRecord.stockAdded || 0;
      const stockConsumed = newRecord.stockConsumed || 0;
      const newBalance = currentBalance + stockAdded - stockConsumed;
      
      const insertData = {
        date: newRecord.date || new Date().toISOString().split('T')[0],
        stock_added: stockAdded,
        stock_consumed: stockConsumed,
        balance: newBalance,
        notes: newRecord.notes || "",
      };
      
      const { error } = await supabase
        .from('mgco3_stock')
        .insert(insertData);
      
      if (error) throw error;
      
      // Refresh records
      await fetchRecords();
      
      // Reset form
      setNewRecord({
        date: new Date().toISOString().split('T')[0],
        stockAdded: 0,
        stockConsumed: 0,
        notes: "",
      });
      setErrors([]);
      setShowForm(false);
      
      alert('Stock record saved successfully!');
    } catch (error: any) {
      console.error('Error saving stock record:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const { error } = await supabase
        .from('mgco3_stock')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchRecords();
      alert('Record deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting record:', error);
      alert('Failed to delete: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar activeItem="mgco3-stock" />
      <div className="flex-1 bg-slate-50 overflow-auto">
        {/* Dark Blue Header */}
        <div className="bg-slate-900 text-white px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Database className="h-7 w-7 text-blue-400" />
                MGCO3 Stock Management
              </h1>
              <p className="text-slate-400 mt-1">Track available stone inventory and auto-consumption</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Cancel" : "Add Stock"}
            </Button>
          </div>
          
          {/* Current Balance Display */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentBalance > 100 ? 'bg-emerald-500' : currentBalance > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
              <span className="text-sm text-slate-300">Available Stock: {currentBalance.toFixed(2)} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-300">{records.length} Transactions</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Alert for low stock */}
          {currentBalance < 100 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Low stock alert! Current balance is {currentBalance.toFixed(2)} kg. Please add more stock.
              </AlertDescription>
            </Alert>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current Balance</p>
                  <p className={`text-3xl font-bold ${currentBalance < 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {currentBalance.toFixed(2)} kg
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Added</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {records.reduce((acc, r) => acc + (r.stockAdded || 0), 0).toFixed(2)} kg
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Consumed</p>
                  <p className="text-3xl font-bold text-rose-600">
                    {records.reduce((acc, r) => acc + (r.stockConsumed || 0), 0).toFixed(2)} kg
                  </p>
                </div>
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-rose-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Batches</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {records.filter(r => r.notes?.includes('Batch')).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add New Record Form */}
          {showForm && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Stock Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {errors.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stockAdded" className="text-sm font-medium">
                      Stock Added (kg)
                    </Label>
                    <Input
                      id="stockAdded"
                      type="number"
                      placeholder="0"
                      value={newRecord.stockAdded || ""}
                      onChange={(e) => setNewRecord({ ...newRecord, stockAdded: parseFloat(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stockConsumed" className="text-sm font-medium">
                      Stock Consumed (kg)
                    </Label>
                    <Input
                      id="stockConsumed"
                      type="number"
                      placeholder="0"
                      value={newRecord.stockConsumed || ""}
                      onChange={(e) => setNewRecord({ ...newRecord, stockConsumed: parseFloat(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      placeholder="e.g., New stock received"
                      value={newRecord.notes || ""}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleAddRecord}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" /> Save Entry</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setErrors([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock History Table */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-slate-100 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-800">Stock History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Date</TableHead>
                    <TableHead className="font-bold text-slate-700">Added (kg)</TableHead>
                    <TableHead className="font-bold text-slate-700">Consumed (kg)</TableHead>
                    <TableHead className="font-bold text-slate-700">Balance (kg)</TableHead>
                    <TableHead className="font-bold text-slate-700">Notes</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading records...
                      </td>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No stock records yet. Add your first stock entry above.
                      </td>
                    </TableRow>
                  ) : (
                    [...records].reverse().map((record) => (
                      <TableRow key={record.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">
                          {record.stockAdded > 0 ? `+${record.stockAdded.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-rose-600 font-semibold">
                          {record.stockConsumed > 0 ? `-${record.stockConsumed.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className={`font-bold ${record.balance < 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {record.balance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {!record.notes?.includes('Auto-consumed') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
