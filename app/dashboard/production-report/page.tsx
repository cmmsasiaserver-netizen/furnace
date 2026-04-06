"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Clock, Fuel, Trash2, Package, Users, TrendingUp, DollarSign, Loader2, Factory, AlertCircle, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

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
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
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

  // Calculate hours when start or end time changes
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

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!newRecord.date) newErrors.push("Date is required");
    if (!newRecord.batchNo || newRecord.batchNo.trim() === "") newErrors.push("Batch No is required");
    if (!newRecord.startTime) newErrors.push("Start Time is required");
    if (!newRecord.endTime) newErrors.push("End Time is required");
    if (!newRecord.materialInput || newRecord.materialInput <= 0) newErrors.push("Material Input must be greater than 0");
    if (!newRecord.outputAfterCooking || newRecord.outputAfterCooking <= 0) newErrors.push("Output After Cooking must be greater than 0");
    if (!newRecord.labourHours || newRecord.labourHours <= 0) newErrors.push("Labour Hours must be greater than 0");
    if (!newRecord.numberOfLabour || newRecord.numberOfLabour <= 0) newErrors.push("Number of Labour must be greater than 0");
    if (newRecord.shiftingCost === undefined || newRecord.shiftingCost === null) newErrors.push("Shifting Cost is required");
    if (!newRecord.fuels || newRecord.fuels.length === 0) newErrors.push("At least one fuel entry is required");
    
    // Validate each fuel entry
    if (newRecord.fuels && newRecord.fuels.length > 0) {
      newRecord.fuels.forEach((fuel, index) => {
        if (!fuel.fuelWeight || fuel.fuelWeight <= 0) {
          newErrors.push(`Fuel entry #${index + 1}: Weight must be greater than 0`);
        }
      });
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleAddRecord = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields correctly.\n\nMissing:\n" + errors.join("\n"));
      return;
    }
    
    setSaving(true);
    
    try {
      // Insert production record
      const insertData = {
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
      };
      
      const { data: recordData, error: recordError } = await supabase
        .from('production_records')
        .insert(insertData)
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
      
      // Reset form and hide it
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
      setErrors([]);
      setShowForm(false);
      
      alert('Record saved successfully!');
    } catch (error: any) {
      console.error('Error saving record:', error);
      alert('Failed to save record: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Calculate summary stats
  const totalBatches = records.length;
  const totalHours = records.reduce((acc, r) => acc + r.totalHours, 0);
  const avgYield = totalBatches > 0 ? records.reduce((acc, r) => acc + r.yieldPercentage, 0) / totalBatches : 0;
  const totalOutput = records.reduce((acc, r) => acc + r.outputAfterCooking, 0);
  const totalFuelCost = records.reduce((acc, r) => acc + r.totalFuelCost, 0);
  const totalLabourCost = records.reduce((acc, r) => acc + r.labourCost, 0);
  const totalCost = records.reduce((acc, r) => acc + r.totalCost, 0);

  // Export records to Excel
  const exportToExcel = () => {
    if (records.length === 0) {
      alert("No records to export");
      return;
    }

    // Prepare data for export
    const exportData = records.map((record) => {
      // Calculate fuel weights for each type
      const woodWeight = record.fuels
        .filter((f) => f.fuelType === "wood")
        .reduce((sum, f) => sum + (f.fuelWeight || 0), 0);
      const pelletWeight = record.fuels
        .filter((f) => f.fuelType === "pellet")
        .reduce((sum, f) => sum + (f.fuelWeight || 0), 0);
      const fibreWeight = record.fuels
        .filter((f) => f.fuelType === "fibre")
        .reduce((sum, f) => sum + (f.fuelWeight || 0), 0);
      const woodHuskWeight = record.fuels
        .filter((f) => f.fuelType === "wood-husk")
        .reduce((sum, f) => sum + (f.fuelWeight || 0), 0);
      const otherFuelTotal = fibreWeight + woodHuskWeight;

      return {
        Date: record.date,
        "Batch No": record.batchNo,
        "Start Time": record.startTime,
        "End Time": record.endTime,
        "Total Hours": record.totalHours,
        "Material Input (kg)": record.materialInput,
        "Output After Cooking (kg)": record.outputAfterCooking,
        "Yield %": record.yieldPercentage,
        "Wood (kg)": woodWeight || 0,
        "Pellet (kg)": pelletWeight || 0,
        "Other Fuel (kg)": otherFuelTotal || 0,
        "Total Fuel Weight (kg)": record.totalFuelWeight || 0,
        "Total Fuel Cost": record.totalFuelCost || 0,
        "Labour Hours": record.labourHours,
        "Number of Labour": record.numberOfLabour,
        "Labour Cost": record.labourCost,
        "Shifting Cost": record.shiftingCost,
        "Total Cost": record.totalCost,
        "Cost per kg": record.costPerKg,
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 12 }, // Batch No
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 12 }, // Total Hours
      { wch: 20 }, // Material Input
      { wch: 25 }, // Output After Cooking
      { wch: 10 }, // Yield %
      { wch: 12 }, // Wood
      { wch: 12 }, // Pellet
      { wch: 15 }, // Other Fuel
      { wch: 20 }, // Total Fuel Weight
      { wch: 15 }, // Total Fuel Cost
      { wch: 13 }, // Labour Hours
      { wch: 17 }, // Number of Labour
      { wch: 12 }, // Labour Cost
      { wch: 14 }, // Shifting Cost
      { wch: 12 }, // Total Cost
      { wch: 12 }, // Cost per kg
    ];
    ws["!cols"] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Report");

    // Generate filename with current date
    const today = new Date().toISOString().split("T")[0];
    const filename = `Production_Report_${today}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar activeItem="production-report" />
      <div className="flex-1 bg-slate-50 overflow-auto">
        {/* Dark Blue Header - Matching Asset Management */}
        <div className="bg-slate-900 text-white px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Factory className="h-7 w-7 text-blue-400" />
                Production Report
              </h1>
              <p className="text-slate-400 mt-1">Batching time tracking and production efficiency analysis</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                disabled={records.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? "Cancel" : "Add Record"}
              </Button>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-300">{totalBatches} Batches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-300">{totalOutput.toFixed(0)} kg Total Output</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Batches</p>
                  <p className="text-3xl font-bold text-slate-900">{totalBatches}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Hours</p>
                  <p className="text-3xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg Yield %</p>
                  <p className="text-3xl font-bold text-slate-900">{avgYield.toFixed(1)}%</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Cost</p>
                  <p className="text-3xl font-bold text-slate-900">Rs. {(totalCost / 1000).toFixed(1)}k</p>
                </div>
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add New Record Form - Collapsible */}
          {showForm && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Batching Record
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {errors.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fill all required fields: {errors.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Basic Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
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
                    <Label htmlFor="batchNo" className="text-sm font-medium">
                      Batch No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="batchNo"
                      placeholder="e.g., B-001"
                      value={newRecord.batchNo}
                      onChange={(e) => setNewRecord({ ...newRecord, batchNo: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newRecord.startTime}
                      onChange={(e) => setNewRecord({ ...newRecord, startTime: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium">
                      End Time <span className="text-red-500">*</span>
                    </Label>
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
                      Fuel Usage <span className="text-red-500">*</span>
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
                  
                  {(!newRecord.fuels || newRecord.fuels.length === 0) && (
                    <Alert className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>At least one fuel entry is required</AlertDescription>
                    </Alert>
                  )}
                  
                  {newRecord.fuels?.map((fuel, index) => (
                    <div key={fuel.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-3 p-3 bg-slate-50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Fuel Type *</Label>
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
                        <Label className="text-xs font-medium text-slate-600">Fuel Weight (kg) *</Label>
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
                    Material Input & Output <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="materialInput" className="text-sm font-medium">
                        Material Input (kg) <span className="text-red-500">*</span>
                      </Label>
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
                      <Label htmlFor="outputAfterCooking" className="text-sm font-medium">
                        Output After Cooking (kg) <span className="text-red-500">*</span>
                      </Label>
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
                    Labour Cost (Rs. {LABOUR_RATE_PER_HOUR}/hour) <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="labourHours" className="text-sm font-medium">
                        Labour Hours <span className="text-red-500">*</span>
                      </Label>
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
                      <Label htmlFor="numberOfLabour" className="text-sm font-medium">
                        No. of Labour <span className="text-red-500">*</span>
                      </Label>
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
                    Other Costs <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="shiftingCost" className="text-sm font-medium">
                        Shifting Cost (Rs.) <span className="text-red-500">*</span>
                      </Label>
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
                
                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={handleAddRecord}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" /> Save Record</>
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

          {/* Records Table */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-slate-100 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-800">Batching Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                        No records yet. Click "Add Record" to add your first batching record.
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
        </div>
      </div>
    </div>
  );
}
