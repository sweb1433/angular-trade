import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceUrl } from '../common/ServiceUrl';
import { OutlookModel } from '../models/OutlookModel';
import { forkJoin, interval, Observable, of } from 'rxjs';
import { SummaryModel } from '../models/SummaryModel';
import { NewsModel } from '../models/NewsModel';
import { DetailsModel } from '../models/DetailsModel';
import { concatMap } from 'rxjs/operators';
import { StockInfoModel } from '../models/StockInfoModel';


@Injectable({
    providedIn: 'root'
})
export class DetailsService {

    detailsModel: DetailsModel;

    constructor(private _http: HttpClient) { }

    formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return [year, month, day].join('-');
    }

    getDetails(ticker: string, firstTime: boolean): Observable<DetailsModel> {
        let twoYearAgoDate = new Date().setFullYear(new Date().getFullYear() - 2);
        let startDate = this.formatDate(twoYearAgoDate);
        let today = new Date();
        let dailyStartDate;
        if (today.getDay() == 6 || today.getDay() == 0) {
            let now = new Date();
            let day = now.getDay();
            let diff = (day <= 5) ? (7 - 5 + day ) : (day - 5);
            let friday = new Date();
            friday.setDate(now.getDate() - diff);
            friday.setHours(0);
            friday.setMinutes(0);
            friday.setSeconds(0);
            dailyStartDate = this.formatDate(friday);
        }
        else {
            dailyStartDate = this.formatDate(today);
        }
        if (firstTime) {
            return forkJoin({
                outlookModel: this._http.get<OutlookModel>(ServiceUrl.outlookUrl + ticker),
                summaryModel: this._http.get<SummaryModel>(ServiceUrl.summaryUrl + ticker),
                newsModel: this._http.get<NewsModel>(ServiceUrl.newsUrl + ticker),
                dailyModel: this._http.get<StockInfoModel>(ServiceUrl.dailyUrl + ticker + "?startDate=" + dailyStartDate + "&resampleFreq=4min"),
                historicalModel: this._http.get<StockInfoModel>(ServiceUrl.historicalUrl + ticker + "?startDate=" + startDate)
            }).pipe(
                concatMap(result => {
                    this.detailsModel = new DetailsModel();
                    this.detailsModel.outlookModel = result.outlookModel;
                    this.detailsModel.summaryModel = result.summaryModel;
                    this.detailsModel.newsModel = result.newsModel;
                    this.detailsModel.historicalStockInfo = result.historicalModel;
                    this.detailsModel.dailyStockInfo = result.dailyModel;
                    return of(this.detailsModel);
                })
            );
        }
        else {
            return forkJoin({
                outlookModel: this._http.get<OutlookModel>(ServiceUrl.outlookUrl + ticker),
                summaryModel: this._http.get<SummaryModel>(ServiceUrl.summaryUrl + ticker),
                newsModel: this._http.get<NewsModel>(ServiceUrl.newsUrl + ticker),
                dailyModel: this._http.get<StockInfoModel>(ServiceUrl.dailyUrl + ticker + "?startDate=" + dailyStartDate + "&resampleFreq=4min")
            }).pipe(
                concatMap(result => {
                    this.detailsModel = new DetailsModel();
                    this.detailsModel.outlookModel = result.outlookModel;
                    this.detailsModel.summaryModel = result.summaryModel;
                    this.detailsModel.newsModel = result.newsModel;
                    this.detailsModel.dailyStockInfo = result.dailyModel;
                    return of(this.detailsModel);
                })
            );
        }
    }
}
