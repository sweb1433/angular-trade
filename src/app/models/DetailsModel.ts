import { NewsModel } from './NewsModel';
import { OutlookModel } from './OutlookModel';
import { StockInfoModel } from './StockInfoModel';
import { SummaryModel } from './SummaryModel';

export class DetailsModel {
    newsModel: NewsModel;
    outlookModel: OutlookModel;
    historicalStockInfo: StockInfoModel;
    dailyStockInfo: StockInfoModel;
    summaryModel: SummaryModel;
}