"use client"
import React, { createContext, useContext, useState } from "react"
import { mgo_data } from "./data"
import { MGORecord } from "./types"

interface MGOStoreContextType {
    records: MGORecord[]
    addRecord: (r: MGORecord) => void
}

const MGOStoreContext = createContext<MGOStoreContextType | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<MGORecord[]>(mgo_data)
    
    const addRecord = (r: MGORecord) => {
        setRecords(prev => [...prev, r])
    }

    return (
        <MGOStoreContext.Provider value={{ records, addRecord }}>
            {children}
        </MGOStoreContext.Provider>
    )
}

export function useMGOStore() {
    const context = useContext(MGOStoreContext)
    if (!context) throw new Error("useMGOStore must be used within StoreProvider")
    return context
}
