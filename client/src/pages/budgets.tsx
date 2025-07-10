import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Calendar, Building, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@shared/schema";

export default function Budgets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const { data: budgets, isLoading, error } = useQuery<Budget[]>({
    queryKey: ['/api/budgets'],
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Budgets</h1>
          <p className="text-muted-foreground">Manage your project budgets</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Budgets</h2>
          <p className="text-muted-foreground">
            There was an error loading your budgets. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const getProjectName = (projectId: number) => {
    const project = projects?.find((p: any) => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  const filteredBudgets = budgets?.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || budget.status === statusFilter;
    const matchesSource = sourceFilter === "all" || budget.primaryDataSource === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "CBRE":
        return "bg-purple-100 text-purple-800";
      case "JLL":
        return "bg-orange-100 text-orange-800";
      case "T&T":
        return "bg-cyan-100 text-cyan-800";
      case "MMC":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Budgets</h1>
            <p className="text-muted-foreground">
              Manage and track your project budgets
            </p>
          </div>
          <Link href="/new-budget">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Budget
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="CBRE">CBRE</SelectItem>
              <SelectItem value="JLL">JLL</SelectItem>
              <SelectItem value="T&T">T&T</SelectItem>
              <SelectItem value="MMC">MMC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBudgets?.map((budget) => (
          <Link key={budget.id} href={`/budget/${budget.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">{budget.name}</CardTitle>
                  <Badge className={getStatusColor(budget.status)}>
                    {budget.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span className="truncate">{getProjectName(budget.projectId)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <Badge variant="outline" className={getSourceColor(budget.primaryDataSource)}>
                      {budget.primaryDataSource}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Scope</span>
                    <span className="text-sm font-medium">{budget.scope}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Specification</span>
                    <span className="text-sm font-medium">{budget.specification}</span>
                  </div>
                  {budget.totalCost && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Cost</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(budget.totalCost, budget.localCurrencyCode || 'USD')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Updated</span>
                    </div>
                    <span>{new Date(budget.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredBudgets?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 mb-4 text-gray-400">
            <Building className="w-full h-full" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
              ? "Try adjusting your filters or search term"
              : "Create your first budget to get started"}
          </p>
          <Link href="/new-budget">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}