"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Factory, Warehouse, Truck } from "lucide-react";

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark Blue Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-12 relative">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                Asia Poultry
              </div>
              <div className="text-[8px] text-slate-600">Feeds</div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          ASIA POULTRY <span className="text-blue-500">FEEDS</span>
        </h1>
        <p className="text-sm text-slate-400 mb-8">(PVT) LTD.</p>

        {/* System Title */}
        <h2 className="text-lg text-white text-center mb-2">
          Computerized Maintenance Management
        </h2>
        <h2 className="text-lg text-white text-center mb-6">System</h2>

        {/* Subtitle */}
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Advanced Computerized Maintenance Management System for modern
          industrial excellence.
        </p>

        {/* Company Units */}
        <div className="absolute bottom-12 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-slate-400 ml-2">Trusted by all units</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Sign in to access the maintenance management system
          </p>

          <form className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username
              </Label>
              <Select>
                <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Maintenance Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password..."
                className="h-11 bg-slate-50 border-slate-200"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal text-slate-600 cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
