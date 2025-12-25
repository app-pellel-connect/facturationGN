import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { formatGNF, formatDate } from "@/lib/formatCurrency";
import { Plus, Search, FileText, Loader2, Filter, X, ArrowUpDown, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

const statusConfig = {
  draft: { label: "Brouillon", class: "status-draft" },
  sent: { label: "Envoyée", class: "status-sent" },
  partial: { label: "Partiel", class: "status-partial" },
  paid: { label: "Payée", class: "status-paid" },
  cancelled: { label: "Annulée", class: "status-cancelled" },
  overdue: { label: "En retard", class: "bg-destructive/20 text-destructive border-destructive/30" },
};

type SortField = "date" | "amount" | "client";
type SortOrder = "asc" | "desc";

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, isLoading } = useInvoices();
  const { clients } = useClients();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Handle URL params for status
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter((inv) => {
      // Search filter
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.clients?.name?.toLowerCase().includes(search.toLowerCase());

      // Status filter (including overdue)
      let matchesStatus = true;
      if (statusFilter === "overdue") {
        if (inv.status === "paid" || inv.status === "cancelled" || inv.status === "draft") {
          matchesStatus = false;
        } else if (inv.due_date) {
          const dueDate = new Date(inv.due_date);
          matchesStatus = dueDate < today;
        } else {
          matchesStatus = false;
        }
      } else if (statusFilter !== "all") {
        matchesStatus = inv.status === statusFilter;
      }

      // Client filter
      const matchesClient = clientFilter === "all" || inv.client_id === clientFilter;

      // Date filter
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(inv.issue_date) >= new Date(dateFrom);
      }
      if (dateTo && matchesDate) {
        matchesDate = new Date(inv.issue_date) <= new Date(dateTo);
      }

      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
          break;
        case "amount":
          comparison = Number(a.total) - Number(b.total);
          break;
        case "client":
          comparison = (a.clients?.name || "").localeCompare(b.clients?.name || "");
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [invoices, search, statusFilter, clientFilter, dateFrom, dateTo, sortField, sortOrder, today]);

  const isOverdue = (inv: Invoice) => {
    if (inv.status === "paid" || inv.status === "cancelled" || inv.status === "draft") return false;
    if (!inv.due_date) return false;
    return new Date(inv.due_date) < today;
  };

  const activeFiltersCount = [statusFilter !== "all", clientFilter !== "all", !!dateFrom, !!dateTo].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setClientFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchParams({});
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const paid = filteredAndSortedInvoices.filter((i) => i.status === "paid").length;
    const overdue = filteredAndSortedInvoices.filter(isOverdue).length;
    return { total, count: filteredAndSortedInvoices.length, paid, overdue };
  }, [filteredAndSortedInvoices]);

  return (
    <AppLayout title="Factures">
      <div className="space-y-4 px-4 sm:px-6 lg:px-8 py-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="glass p-2 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-sm sm:text-lg">{stats.count}</p>
          </Card>
          <Card className="glass p-2 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Payées</p>
            <p className="font-bold text-sm sm:text-lg text-success">{stats.paid}</p>
          </Card>
          <Card className="glass p-2 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">En retard</p>
            <p className="font-bold text-sm sm:text-lg text-destructive">{stats.overdue}</p>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="partial">Partiel</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                      <SelectItem value="overdue">
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          En retard
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Date début</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date fin</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Trier par</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={sortField === "date" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSort("date")}
                      className="flex-1"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Date
                      {sortField === "date" && <ArrowUpDown className="h-3 w-3 ml-1" />}
                    </Button>
                    <Button
                      variant={sortField === "amount" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSort("amount")}
                      className="flex-1"
                    >
                      Montant
                      {sortField === "amount" && <ArrowUpDown className="h-3 w-3 ml-1" />}
                    </Button>
                    <Button
                      variant={sortField === "client" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSort("client")}
                      className="flex-1"
                    >
                      Client
                      {sortField === "client" && <ArrowUpDown className="h-3 w-3 ml-1" />}
                    </Button>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setShowFilters(false)}>
                  Appliquer ({filteredAndSortedInvoices.length} résultats)
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/invoices/new">
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Active filters badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            {clientFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {clients.find((c) => c.id === clientFilter)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setClientFilter("all")} />
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary" className="gap-1">
                Depuis {dateFrom}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom("")} />
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="gap-1">
                Jusqu'au {dateTo}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo("")} />
              </Badge>
            )}
          </div>
        )}

        {/* Invoices List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedInvoices.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search || activeFiltersCount > 0 ? "Aucune facture trouvée" : "Aucune facture"}
              </p>
              {!search && activeFiltersCount === 0 && (
                <Link to="/invoices/new" className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer une facture
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedInvoices.map((invoice, index) => {
              const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.draft;
              const balance = invoice.balance ?? Number(invoice.total) - Number(invoice.paid_amount || 0);
              const hasBalance = balance > 0 && invoice.status !== "cancelled";
              const invoiceIsOverdue = isOverdue(invoice);

              return (
                <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="block">
                  <Card
                    className={`glass card-hover animate-slide-up active:scale-[0.98] transition-transform ${invoiceIsOverdue ? "border-destructive/50" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">{invoice.invoice_number}</h3>
                            {invoiceIsOverdue ? (
                              <Badge
                                className="bg-destructive/20 text-destructive border-destructive/30 text-xs gap-1"
                                variant="outline"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                En retard
                              </Badge>
                            ) : (
                              <Badge className={`${status.class} text-xs`} variant="secondary">
                                {status.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                            {invoice.clients?.name || "Sans client"}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            {formatDate(invoice.issue_date)}
                            {invoice.due_date && (
                              <span className={invoiceIsOverdue ? "text-destructive ml-2" : "ml-2"}>
                                • Échéance: {formatDate(invoice.due_date)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm sm:text-base">{formatGNF(invoice.total)}</p>
                          {hasBalance && (
                            <p
                              className={`text-xs sm:text-sm font-medium ${invoiceIsOverdue ? "text-destructive" : "text-warning"}`}
                            >
                              Solde: {formatGNF(balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
