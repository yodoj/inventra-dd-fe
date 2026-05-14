export interface BreakdownUnit {
  unit: string
  totalBarang: number
  totalBiaya: number
}

export interface TotalPengadaan {
  totalBarang: number
  totalBiaya: number
}

export interface TopBiaya {
  namaAset: string
  totalBiaya: number
}

export interface TopDashboard {
  topBiaya: TopBiaya[]
}

export interface DashboardPengadaan {
  total: TotalPengadaan
  breakdownUnit: BreakdownUnit[]
  topBiaya: TopBiaya[]
  // topPengadaan: TopDashboard[]
}
