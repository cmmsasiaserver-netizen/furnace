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

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark Blue Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-12 relative">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-full h-full p-2">
              {/* Asia Poultry Feeds Logo - Abstract triangle shapes */}
              <polygon points="100,40 140,140 60,140" fill="#FF6B35" opacity="0.9" />
              <polygon points="100,40 160,160 80,160" fill="#F7931E" opacity="0.7" />
              <polygon points="100,40 120,160 40,160" fill="#C1272D" opacity="0.6" />
              <polygon points="100,40 100,160 20,160" fill="#00A651" opacity="0.5" />
            </svg>
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
                  <SelectItem value="tdm">TDM</SelectItem>
                  <SelectItem value="furnace-incharge">Furnace Incharge</SelectItem>
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
                defaultValue="demo123"
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
