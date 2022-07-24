export class WatchlistModel {
    companyName: string;
    stockTickerSymbol: string;
    lastPrice: number;
    change: number;
    changeStr: string;
    changePercentage: number;
    changePercentageStr: string;
    isChanged: boolean;
    isPositive: boolean;
}