export class SummaryModel {
    parsing: boolean;
    stockTickerSymbol: string;
    timestamp: string;
    lastPrice: number;
    previousClosingPrice: number;
    openingPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    bidSize: number;
    bidPrice: number;
    askSize: number;
    askPrice: number;
    midPrice: number;
}