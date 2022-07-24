import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ServiceUrl } from '../common/ServiceUrl';
import { PortfolioStorageModel } from '../models/PortfolioStorageModel';
import { SummaryModel } from '../models/SummaryModel';

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {

    constructor(private _http: HttpClient) { }

    buyStock(stockTicker: string, quantityBought: number, newTotalCost: number, companyName: string) {
        let portfolioStorageModelJson = window.localStorage.getItem("portfolio");
        
        let portfolioStorageModel = new PortfolioStorageModel();
        portfolioStorageModel.ticker = stockTicker;
        portfolioStorageModel.quantity = quantityBought;
        portfolioStorageModel.totalCost = newTotalCost;
        portfolioStorageModel.companyName = companyName;

        if (portfolioStorageModelJson == null) {
            window.localStorage.setItem("portfolio", JSON.stringify([portfolioStorageModel]));
        }
        else {
            let existingPortfolioStorageModels = JSON.parse(portfolioStorageModelJson);
            let found = false;
            for (let i = 0; i < existingPortfolioStorageModels.length; ++i) {
                if (existingPortfolioStorageModels[i]["ticker"] === portfolioStorageModel["ticker"]) {
                    existingPortfolioStorageModels[i]["quantity"] += portfolioStorageModel["quantity"];
                    existingPortfolioStorageModels[i]["totalCost"] = portfolioStorageModel["totalCost"];
                    found = true;
                    break;
                }
            }
            if (!found) {
                existingPortfolioStorageModels.push(portfolioStorageModel);
            }
            window.localStorage.setItem("portfolio", JSON.stringify(existingPortfolioStorageModels));
        }
    }

    sellStock(stockTicker: string, quantitySold: number, newTotalCost: number) {
        let portfolioStorageModels = JSON.parse(window.localStorage.getItem("portfolio"));
        for (let i = 0; i < portfolioStorageModels.length; ++i) {
            if (portfolioStorageModels[i]["ticker"] === stockTicker) {
                portfolioStorageModels[i]["quantity"] -= quantitySold;
                portfolioStorageModels[i]["totalCost"] = newTotalCost;
                break;
            }
        }
        window.localStorage.setItem("portfolio", JSON.stringify(portfolioStorageModels));
    }

    removeStock(stockTicker: string) {
        let portfolioStorageModels = JSON.parse(window.localStorage.getItem("portfolio"));
        let newPortfolioStorageModels = [];
        for (let i = 0; i < portfolioStorageModels.length; ++i) {
            if (portfolioStorageModels[i]["ticker"] !== stockTicker) {
                newPortfolioStorageModels.push(portfolioStorageModels[i]);
            }
        }
        if (newPortfolioStorageModels.length == 0) {
            window.localStorage.removeItem("portfolio");
        }
        else {
            window.localStorage.setItem("portfolio", JSON.stringify(newPortfolioStorageModels));
        }
    }

    getPortfolioDetails(ticker: string): PortfolioStorageModel {
        let portfolioStorageModels = JSON.parse(window.localStorage.getItem("portfolio"));
        for (let i = 0; i < portfolioStorageModels.length; ++i) {
            if (portfolioStorageModels[i]["ticker"] === ticker) {
                return portfolioStorageModels[i];
            }
        }
        return null;
    }

    getLatestPrice(stockTicker: string): Observable<{ "ticker": string, "price": number }> {
        return this._http.get<SummaryModel>(ServiceUrl.summaryUrl + stockTicker)
            .pipe(
                concatMap(summaryModel => {
                    let obj = { "ticker": stockTicker, "price": summaryModel.lastPrice };
                    return of(obj);
                })
            );
    }
}
