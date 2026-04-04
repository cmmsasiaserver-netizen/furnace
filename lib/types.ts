export interface MGORecord {
    id: string;
    date: string;
    materialInput: number;
    materialOutput: number;
    yield: number;
    fuelUsed: number;
    fuelCost: number;
    laborCost: number;
    shiftingCost: number;
    costPerKg: number;
    totalCost: number;
    availableStone: number;
    remarks: string;
}

export interface MGOState {
    records: MGORecord[];
}
