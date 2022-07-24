import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ServiceUrl } from '../common/ServiceUrl';
import { Utility } from '../common/Utility';
import { OutlookModel } from '../models/OutlookModel';
import { SummaryModel } from '../models/SummaryModel';
import { WatchlistModel } from '../models/WatchlistModel';

@Injectable({
    providedIn: 'root'
})
export class WatchlistService {

    constructor(private _http: HttpClient) { }

    addTickerToWatchlist(stockTicker: string) {
        let watchlist = window.localStorage.getItem("watchlist");
        if (watchlist == null) {
            let newWatchlist: string[] = [];
            newWatchlist.push(stockTicker);
            window.localStorage.setItem("watchlist", newWatchlist.toString());
        }
        else {
            let existingWatchlist = watchlist.split(",");
            existingWatchlist.push(stockTicker);
            window.localStorage.setItem("watchlist", existingWatchlist.toString());
        }
    }

    removeTickerFromWatchlist(stockTicker: string) {
        let watchlist = window.localStorage.getItem("watchlist").split(",");
        let newWatchlist: string[] = [];
        for (let i = 0;i < watchlist.length;++i) {
            if (watchlist[i] != stockTicker) {
                newWatchlist.push(watchlist[i]);
            }
        }
        if (newWatchlist.length == 0) {
            window.localStorage.removeItem("watchlist");
        }
        else {
            window.localStorage.setItem("watchlist", newWatchlist.toString());
        }
    }

    contains(stockTicker: string): boolean {
        let watchlist = window.localStorage.getItem("watchlist");
        if (watchlist == null) {
            return false;
        }
        else {
            let existingWatchlist = watchlist.split(",");
            for (let i = 0;i < existingWatchlist.length;++i) {
                if (existingWatchlist[i] == stockTicker) {
                    return true;
                }
            }
            return false;
        }
    }

    getWatchlistDisplayData(ticker: string): Observable<WatchlistModel> {
        return forkJoin(
            {
                outlookModel: this._http.get<OutlookModel>(ServiceUrl.outlookUrl + ticker),
                summaryModel: this._http.get<SummaryModel>(ServiceUrl.summaryUrl + ticker)
            }
        ).pipe(
            concatMap(result => {
                let data = new WatchlistModel();
                data.companyName = result.outlookModel.companyName
                data.stockTickerSymbol = result.outlookModel.stockTickerSymbol
                data.lastPrice = result.summaryModel.lastPrice
                data.change = result.summaryModel.lastPrice - result.summaryModel.previousClosingPrice;
                if (data.change > 0) {
                    data.isChanged = true;
                    data.isPositive = true;
                }
                else if (data.change < 0) {
                    data.isChanged = true;
                    data.isPositive = false;
                }
                else {
                    data.isChanged = false;
                }
                data.changeStr = Utility.beautify(data.change);
                data.changePercentage = (data.change * 100) / result.summaryModel.previousClosingPrice;
                data.changePercentageStr = Utility.beautify(data.changePercentage);
                return of(data);
            })
        );
    }
}
