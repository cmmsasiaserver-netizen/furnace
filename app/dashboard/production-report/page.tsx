"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Clock, Fuel, Trash2, Package, Users, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FuelType = "wood" | "pellet" | "fibre" | "wood-husk";

const FUEL_PRICES: Record<FuelType, number> = {
  wood: 25,
  pellet: 52,
  fibre: 12,
  "wood-husk": 14.25,
};

const FUEL_LABELS: Record<FuelType, string> = {
  wood: "Wood",
  pellet: "Pellet",
  fibre: "Fibre",
  "wood-husk": "Wood Husk",
};

const LABOUR_RATE_PER_HOUR = 168.75;

interface FuelEntry {
  id: string;
  fuelType: FuelType;
  fuelWeight: number;
  fuelCost: number;
}

interface BatchingRecord {
  id: string;
  date: string;
  batchNo: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  fuels: FuelEntry[];
  totalFuelCost: number;
  totalFuelWeight: number;
  materialInput: number;
  outputAfterCooking: number;
  yieldPercentage: number;
  labourHours: number;
  numberOfLabour: number;
  labourCost: number;
  shiftingCost: number;
  totalCost: number;
  costPerKg: number;
}

export default function ProductionReportPage() {
  const [records, setRecords] = useState<BatchingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<BatchingRecord>>({
    date: new Date().toISOString().split('T')[0],
    batchNo: "",
    startTime: "",
    endTime: "",
    fuels: [],
    totalFuelCost: 0,
    totalFuelWeight: 0,
    materialInput: 0,
    outputAfterCooking: 0,
    yieldPercentage: 0,
    labourHours: 0,
    numberOfLabour: 1,
    labourCost: 0,
    shiftingCost: 0,
    totalCost: 0,
    costPerKg: 0,
  });

  // Add a new fuel entry
  const addFuelEntry = () => {
    const newFuel: FuelEntry = {
      id: Date.now().toString(),
      fuelType: "wood",
      fuelWeight: 0,
      fuelCost: 0,
    };
    setNewRecord(prev => ({
      ...prev,
      fuels: [...(prev.fuels || []), newFuel],
    }));
  };

  // Remove a fuel entry
  const removeFuelEntry = (fuelId: string) => {
    setNewRecord(prev => ({
      ...prev,
      fuels: prev.fuels?.filter(f => f.id !== fuelId) || [],
    }));
  };

  // Update fuel entry
  const updateFuelEntry = (fuelId: string, updates: Partial<FuelEntry>) => {
    setNewRecord(prev => ({
      ...prev,
      fuels: prev.fuels?.map(f => {
        if (f.id === fuelId) {
          const updated = { ...f, ...updates };
          // Auto-calculate cost if type or weight changed
          if (updates.fuelType !== undefined || updates.fuelWeight !== undefined) {
            const weight = updates.fuelWeight !== undefined ? updates.fuelWeight : f.fuelWeight;
            const type = updates.fuelType !== undefined ? updates.fuelType : f.fuelType;
            updated.fuelCost = Math.round(weight * FUEL_PRICES[type] * 100) / 100;
          }
          return updated;
        }
        return f;
      }) || [],
    }));
  };

  // Calculate totals whenever fuels change
  useEffect(() => {
    if (newRecord.fuels) {
      const totalFuelCost = newRecord.fuels.reduce((acc, f) => acc + f.fuelCost, 0);
      const totalFuelWeight = newRecord.fuels.reduce((acc, f) => acc + f.fuelWeight, 0);
      setNewRecord(prev => ({
        ...prev,
        totalFuelCost,
        totalFuelWeight,
      }));
    }
  }, [newRecord.fuels]);

  // Calculate yield percentage when input or output changes
  useEffect(() => {
    const input = newRecord.materialInput || 0;
    const output = newRecord.outputAfterCooking || 0;
    if (input > 0 && output > 0) {
      const yieldPercentage = Math.round((output / input) * 100 * 100) / 100;
      setNewRecord(prev => ({ ...prev, yieldPercentage }));
    }
  }, [newRecord.materialInput, newRecord.outputAfterCooking]);

  // Calculate labour cost when labour hours or number of labour changes
  useEffect(() => {
    const hours = newRecord.labourHours || 0;
    const count = newRecord.numberOfLabour || 0;
    const labourCost = Math.round(hours * count * LABOUR_RATE_PER_HOUR * 100) / 100;
    setNewRecord(prev => ({ ...prev, labourCost }));
  }, [newRecord.labourHours, newRecord.numberOfLabour]);

  // Calculate total cost and cost per kg
  useEffect(() => {
    const fuelCost = newRecord.totalFuelCost || 0;
    const labourCost = newRecord.labourCost || 0;
    const shiftingCost = newRecord.shiftingCost || 0;
    const totalCost = Math.round((fuelCost + labourCost + shiftingCost) * 100) / 100;
    
    const output = newRecord.outputAfterCooking || 0;
    const costPerKg = output > 0 ? Math.round((totalCost / output) * 100) / 100 : 0;
    
    setNewRecord(prev => ({ ...prev, totalCost, costPerKg }));
  }, [newRecord.totalFuelCost, newRecord.labourCost, newRecord.shiftingCost, newRecord.outputAfterCooking]);

  // Fetch records from Supabase on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch production records
      const { data: productionData, error: productionError } = await supabase
        .from('production_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productionError) throw productionError;
      
      // Fetch fuel entries for all records
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_entries')
        .select('*');
      
      if (fuelError) throw fuelError;
      
      // Combine data
      const combinedRecords: BatchingRecord[] = (productionData || []).map((record: any) => ({
        id: record.id,
        date: record.date,
        batchNo: record.batch_no,
        startTime: record.start_time,
        endTime: record.end_time,
        totalHours: record.total_hours,
        materialInput: record.material_input,
        outputAfterCooking: record.output_after_cooking,
        yieldPercentage: record.yield_percentage,
        labourHours: record.labour_hours,
        numberOfLabour: record.number_of_labour,
        labourCost: record.labour_cost,
        shiftingCost: record.shifting_cost,
        totalCost: record.total_cost,
        costPerKg: record.cost_per_kg,
        fuels: (fuelData || [])
          .filter((f: any) => f.record_id === record.id)
          .map((f: any) => ({
            id: f.id,
            fuelType: f.fuel_type,
            fuelWeight: f.fuel_weight,
            fuelCost: f.fuel_cost,
          })),
        totalFuelCost: (fuelData || [])
          .filter((f: any) => f.record_id === record.id)
          .reduce((sum: number, f: any) => sum + f.fuel_cost, 0),
        totalFuelWeight: (fuelData || [])
          .filter((f: any) => f.record_id === record.id)
          .reduce((sum: number, f: any) => sum + f.fuel_weight, 0),
      }));
      
      setRecords(combinedRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save record to Supabase
  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    
    let diffMs = endDate.getTime() - startDate.getTime();
    
    // Handle overnight batches (end time is next day)
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  };

  useEffect(() => {
    if (newRecord.startTime && newRecord.endTime) {
      const hours = calculateHours(newRecord.startTime, newRecord.endTime);
      setNewRecord(prev => ({ ...prev, totalHours: hours }));
    }
  }, [newRecord.startTime, newRecord.endTime]);

  const handleAddRecord = async () => {
    if (!newRecord.batchNo || !newRecord.startTime || !newRecord.endTime) return;
    
    setSaving(true);
    
    try {
      // Insert production record
      const { data: recordData, error: recordError } = await supabase
        .from('production_records')
        .insert({
          date: newRecord.date || new Date().toISOString().split('T')[0],
          batch_no: newRecord.batchNo,
          start_time: newRecord.startTime,
          end_time: newRecord.endTime,
          total_hours: newRecord.totalHours || 0,
          material_input: newRecord.materialInput || 0,
          output_after_cooking: newRecord.outputAfterCooking || 0,
          yield_percentage: newRecord.yieldPercentage || 0,
          labour_hours: newRecord.labourHours || 0,
          number_of_labour: newRecord.numberOfLabour || 1,
          labour_cost: newRecord.labourCost || 0,
          shifting_cost: newRecord.shiftingCost || 0,
          total_cost: newRecord.totalCost || 0,
          cost_per_kg: newRecord.costPerKg || 0,
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Insert fuel entries if any
      if (newRecord.fuels && newRecord.fuels.length > 0) {
        const fuelInserts = newRecord.fuels.map(fuel => ({
          record_id: recordData.id,
          fuel_type: fuel.fuelType,
          fuel_weight: fuel.fuelWeight,
          fuel_cost: fuel.fuelCost,
        }));
        
        const { error: fuelError } = await supabase
          .from('fuel_entries')
          .insert(fuelInserts);
        
        if (fuelError) throw fuelError;
      }
      
      // Refresh records
      await fetchRecords();
      
      // Reset form
      setNewRecord({
        date: new Date().toISOString().split('T')[0],
        batchNo: "",
        startTime: "",
        endTime: "",
        totalHours: 0,
        fuels: [],
        totalFuelCost: 0,
        totalFuelWeight: 0,
        materialInput: 0,
        outputAfterCooking: 0,
        yieldPercentage: 0,
        labourHours: 0,
        numberOfLabour: 1,
        labourCost: 0,
        shiftingCost: 0,
        totalCost: 0,
        costPerKg: 0,
      });
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar activeItem="production-report" />
      <div className="flex-1 bg-slate-50 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Production Report
          </h1>
          <p className="text-slate-500 mt-2">Batching time tracking and production efficiency analysis</p>
        </div>

        {/* Add New Record Form */}
        <Card className="mb-6 border-none shadow-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Batching Record
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batchNo" className="text-sm font-medium">Batch No</Label>
                <Input
                  id="batchNo"
                  placeholder="e.g., B-001"
                  value={newRecord.batchNo}
                  onChange={(e) => setNewRecord({ ...newRecord, batchNo: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newRecord.startTime}
                  onChange={(e) => setNewRecord({ ...newRecord, startTime: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newRecord.endTime}
                  onChange={(e) => setNewRecord({ ...newRecord, endTime: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Total Hours (Auto)
                </Label>
                <div className="h-11 flex items-center px-3 bg-slate-100 rounded-md font-semibold text-slate-700">
                  {newRecord.totalHours?.toFixed(2) || "0.00"} hrs
                </div>
              </div>
            </div>

            {/* Fuel Section */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-amber-600" />
                  Fuel Usage
                </h3>
                <Button 
                  onClick={addFuelEntry} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Fuel
                </Button>
              </div>
              
              {newRecord.fuels?.length === 0 && (
                <p className="text-sm text-slate-500 italic mb-3">No fuels added yet. Click "Add Fuel" to add fuel usage.</p>
              )}
              
              {newRecord.fuels?.map((fuel, index) => (
                <div key={fuel.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-3 p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Fuel Type</Label>
                    <Select
                      value={fuel.fuelType}
                      onValueChange={(value: FuelType) => updateFuelEntry(fuel.id, { fuelType: value })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select fuel..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wood">Wood (Rs. 25/kg)</SelectItem>
                        <SelectItem value="pellet">Pellet (Rs. 52/kg)</SelectItem>
                        <SelectItem value="fibre">Fibre (Rs. 12/kg)</SelectItem>
                        <SelectItem value="wood-husk">Wood Husk (Rs. 14.25/kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Fuel Weight (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Enter weight..."
                      value={fuel.fuelWeight || ""}
                      onChange={(e) => updateFuelEntry(fuel.id, { fuelWeight: parseFloat(e.target.value) || 0 })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Price per kg</Label>
                    <div className="h-10 flex items-center px-3 bg-slate-100 rounded-md font-semibold text-sm text-slate-700">
                      Rs. {FUEL_PRICES[fuel.fuelType].toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      Cost (Auto)
                    </Label>
                    <div className="h-10 flex items-center px-3 bg-amber-50 rounded-md font-bold text-sm text-amber-700">
                      Rs. {fuel.fuelCost.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => removeFuelEntry(fuel.id)}
                      variant="ghost"
                      size="sm"
                      className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {newRecord.fuels && newRecord.fuels.length > 0 && (
                <div className="flex justify-end items-center gap-4 mt-3 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Total Fuel: <span className="font-bold text-slate-900">{newRecord.totalFuelWeight?.toFixed(2)} kg</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Total Cost: <span className="font-bold text-amber-700">Rs. {newRecord.totalFuelCost?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Material Section */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Material Input & Output
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="materialInput" className="text-sm font-medium">Material Input (kg)</Label>
                  <Input
                    id="materialInput"
                    type="number"
                    placeholder="Enter input weight..."
                    value={newRecord.materialInput || ""}
                    onChange={(e) => setNewRecord({ ...newRecord, materialInput: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outputAfterCooking" className="text-sm font-medium">Output After Cooking (kg)</Label>
                  <Input
                    id="outputAfterCooking"
                    type="number"
                    placeholder="Enter output weight..."
                    value={newRecord.outputAfterCooking || ""}
                    onChange={(e) => setNewRecord({ ...newRecord, outputAfterCooking: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Yield % (Auto)
                  </Label>
                  <div className="h-11 flex items-center px-3 bg-emerald-50 rounded-md font-bold text-emerald-700">
                    {newRecord.yieldPercentage?.toFixed(2) || "0.00"}%
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Weight Loss (kg)</Label>
                  <div className="h-11 flex items-center px-3 bg-slate-100 rounded-md font-semibold text-slate-700">
                    {((newRecord.materialInput || 0) - (newRecord.outputAfterCooking || 0)).toFixed(2)} kg
                  </div>
                </div>
              </div>
            </div>

            {/* Labour Section */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Labour Cost (Rs. {LABOUR_RATE_PER_HOUR}/hour)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="labourHours" className="text-sm font-medium">Labour Hours</Label>
                  <Input
                    id="labourHours"
                    type="number"
                    step="0.5"
                    placeholder="Enter hours..."
                    value={newRecord.labourHours || ""}
                    onChange={(e) => setNewRecord({ ...newRecord, labourHours: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfLabour" className="text-sm font-medium">No. of Labour</Label>
                  <Input
                    id="numberOfLabour"
                    type="number"
                    min="1"
                    placeholder="Enter count..."
                    value={newRecord.numberOfLabour || ""}
                    onChange={(e) => setNewRecord({ ...newRecord, numberOfLabour: parseInt(e.target.value) || 1 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rate per Hour</Label>
                  <div className="h-11 flex items-center px-3 bg-slate-100 rounded-md font-semibold text-slate-700">
                    Rs. {LABOUR_RATE_PER_HOUR.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    Labour Cost (Auto)
                  </Label>
                  <div className="h-11 flex items-center px-3 bg-indigo-50 rounded-md font-bold text-indigo-700">
                    Rs. {newRecord.labourCost?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Shifting Cost Section */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Other Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="shiftingCost" className="text-sm font-medium">Shifting Cost (Rs.)</Label>
                  <Input
                    id="shiftingCost"
                    type="number"
                    placeholder="Enter shifting cost..."
                    value={newRecord.shiftingCost || ""}
                    onChange={(e) => setNewRecord({ ...newRecord, shiftingCost: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-rose-600" />
                    Total Cost (Auto)
                  </Label>
                  <div className="h-11 flex items-center px-3 bg-rose-50 rounded-md font-bold text-rose-700">
                    Rs. {newRecord.totalCost?.toFixed(2) || "0.00"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Cost per kg (Auto)
                  </Label>
                  <div className="h-11 flex items-center px-3 bg-blue-50 rounded-md font-bold text-blue-700">
                    Rs. {newRecord.costPerKg?.toFixed(2) || "0.00"}/kg
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleAddRecord}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!newRecord.batchNo || !newRecord.startTime || !newRecord.endTime || saving}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Add Record</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-slate-900 text-white">
            <CardTitle className="text-lg font-bold">Batching Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-slate-700">Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Batch No</TableHead>
                  <TableHead className="font-bold text-slate-700">Time</TableHead>
                  <TableHead className="font-bold text-slate-700">Hours</TableHead>
                  <TableHead className="font-bold text-slate-700">Input/Output</TableHead>
                  <TableHead className="font-bold text-slate-700">Yield %</TableHead>
                  <TableHead className="font-bold text-slate-700">Fuels</TableHead>
                  <TableHead className="font-bold text-slate-700">Labour Cost</TableHead>
                  <TableHead className="font-bold text-slate-700">Total Cost</TableHead>
                  <TableHead className="font-bold text-slate-700">Cost/kg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={10} className="text-center py-8 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading records...
                    </td>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <td colSpan={10} className="text-center py-8 text-slate-500">
                      No records yet. Add your first batching record above.
                    </td>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell className="text-blue-600 font-semibold">{record.batchNo}</TableCell>
                      <TableCell className="text-xs">{record.startTime} - {record.endTime}</TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        {record.totalHours.toFixed(2)} hrs
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>In: {record.materialInput.toFixed(1)}kg</div>
                        <div>Out: {record.outputAfterCooking.toFixed(1)}kg</div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        {record.yieldPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {record.fuels.map((fuel) => (
                            <span key={fuel.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                              {FUEL_LABELS[fuel.fuelType]}: {fuel.fuelWeight.toFixed(0)}kg
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-indigo-600">
                        Rs. {record.labourCost.toFixed(0)}
                      </TableCell>
                      <TableCell className="font-bold text-rose-600">
                        Rs. {record.totalCost.toFixed(0)}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        Rs. {record.costPerKg.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Batches</p>
                  <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Hours</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {records.reduce((acc, r) => acc + r.totalHours, 0).toFixed(2)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg Yield %</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {(records.reduce((acc, r) => acc + r.yieldPercentage, 0) / records.length).toFixed(1)}%
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Output</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {records.reduce((acc, r) => acc + r.outputAfterCooking, 0).toFixed(0)} kg
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Labour Cost</p>
                  <p className="text-2xl font-bold text-slate-900">
                    Rs. {records.reduce((acc, r) => acc + r.labourCost, 0).toFixed(0)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Cost</p>
                  <p className="text-2xl font-bold text-slate-900">
                    Rs. {records.reduce((acc, r) => acc + r.totalCost, 0).toFixed(0)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-rose-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
