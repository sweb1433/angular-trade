export class PortfolioModel {
    ticker: string;
    companyName: string;
    quantity: number;
    avgCostPerShare: number;
    avgCostPerShareStr: string;
    totalCost: number;
    totalCostStr: string;
    change: number;
    changeStr: string;
    currentPrice: number;
    marketValue: number;
    marketValueStr: string;
    changed: boolean;
    isPositive: boolean;
}