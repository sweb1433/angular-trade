import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, zip } from 'rxjs';
import { Utility } from 'src/app/common/Utility';
import { PortfolioModel } from 'src/app/models/PortfolioModel';
import { PortfolioStorageModel } from 'src/app/models/PortfolioStorageModel';
import { PortfolioService } from 'src/app/services/portfolio.service';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-portfolio',
    templateUrl: './portfolio.component.html',
    styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {

    portfolioStorage: PortfolioStorageModel[]
    noPortfolio: boolean
    portfolioModels: PortfolioModel[];

    buyControl = new FormControl();
    sellControl = new FormControl();

    stockbuyable = false;
    stockSellable = false;

    buyStockTicker: string;
    buyStockCurrentPrice: number;
    buyStockCurrentPriceStr: string;
    buyStockQuantity: number;
    buyTotal = 0;
    buyTotalStr = "0";
    buyCompanyName: string;

    sellStockTicker: string;
    sellStockCurrentPrice: number;
    sellStockCurrentPriceStr: string;
    sellStockQuantity: number;
    sellTotal = 0;
    sellTotalStr = "0";
    sellCompanyName: string;

    showSpinner = true;

    closeResult = '';

    constructor(private modalService: NgbModal, private portfolioService: PortfolioService, private router: Router) { }

    ngOnInit(): void {
        if (window.localStorage.getItem("portfolio") == null) {
            this.portfolioStorage = [];
            this.noPortfolio = true;
            this.showSpinner = false;
        }
        else {
            this.portfolioStorage = JSON.parse(window.localStorage.getItem("portfolio"));
            this.noPortfolio = false;
            this.portfolioModels = [];

            let observables: Observable<{ "ticker": string, "price": number }>[] = [];
            for (let i = 0; i < this.portfolioStorage.length; ++i) {
                observables.push(this.portfolioService.getLatestPrice(this.portfolioStorage[i].ticker));
            }

            zip(...observables).subscribe(result => {
                result.sort((a, b) => (a.ticker > b.ticker) ? 1 : ((b.ticker > a.ticker) ? -1 : 0));
                for (let i = 0; i < result.length; ++i) {
                    let portfolioModel = new PortfolioModel();
                    portfolioModel.ticker = result[i].ticker;
                    portfolioModel.currentPrice = result[i].price;

                    let portfolioStorageModel = this.portfolioService.getPortfolioDetails(result[i].ticker);
                    portfolioModel.quantity = portfolioStorageModel.quantity;
                    portfolioModel.companyName = portfolioStorageModel.companyName;
                    portfolioModel.totalCost = portfolioStorageModel.totalCost;
                    portfolioModel.totalCostStr = Utility.beautify(portfolioModel.totalCost);

                    portfolioModel.marketValue = portfolioModel.currentPrice * portfolioModel.quantity;
                    portfolioModel.marketValueStr = Utility.beautify(portfolioModel.marketValue);
                    portfolioModel.avgCostPerShare = portfolioModel.totalCost / portfolioModel.quantity;
                    portfolioModel.avgCostPerShareStr = Utility.beautify(portfolioModel.avgCostPerShare);
                    portfolioModel.change = portfolioModel.currentPrice - portfolioModel.avgCostPerShare;
                    portfolioModel.changeStr = Utility.beautify(portfolioModel.change);

                    if (portfolioModel.change == 0) {
                        portfolioModel.changed = false;
                    }
                    else {
                        portfolioModel.changed = true;
                        if (portfolioModel.change > 0) {
                            portfolioModel.isPositive = true;
                        }
                        else {
                            portfolioModel.isPositive = false;
                        }
                    }

                    this.portfolioModels.push(portfolioModel);
                }
                this.showSpinner = false;
            });
        }
    }

    open(content) {
        this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return `with: ${reason}`;
        }
    }

    buystockpopup(ticker: string, currentPrice: number, companyName: string) {
        this.buyStockTicker = ticker;
        this.buyCompanyName = companyName;
        this.buyStockCurrentPrice = currentPrice;
        this.buyStockCurrentPriceStr = Utility.beautify(this.buyStockCurrentPrice);
        this.buyControl.setValue(0);
        this.buyControl.valueChanges.subscribe(value => {
            if (value > 0) {
                this.stockbuyable = true;
            }
            else {
                this.stockbuyable = false;
            }
            this.buyStockQuantity = value;
            this.buyTotal = value * currentPrice;
            this.buyTotalStr = Utility.beautify(this.buyTotal);
        });
    }

    sellstockpopup(ticker: string, currentPrice: number, quantity: number, companyName: string) {
        this.sellStockTicker = ticker;
        this.sellCompanyName = companyName;
        this.sellStockCurrentPrice = currentPrice;
        this.sellStockCurrentPriceStr = Utility.beautify(this.sellStockCurrentPrice);
        this.sellControl.setValue(0);
        this.sellControl.valueChanges.subscribe(value => {
            if (value > 0 && value <= quantity) {
                this.stockSellable = true;
            }
            else {
                this.stockSellable = false;
            }
            this.sellStockQuantity = value;
            this.sellTotal = value * currentPrice;
            this.sellTotalStr = Utility.beautify(this.sellTotal);
        });
    }

    buystock() {
        for (let i = 0; i < this.portfolioModels.length; ++i) {
            if (this.portfolioModels[i].ticker === this.buyStockTicker) {
                this.portfolioModels[i].quantity += this.buyStockQuantity;
                this.portfolioModels[i].totalCost += this.buyStockQuantity * this.buyStockCurrentPrice;
                this.portfolioModels[i].totalCostStr = Utility.beautify(this.portfolioModels[i].totalCost);
                this.portfolioModels[i].marketValue = this.buyStockCurrentPrice * this.portfolioModels[i].quantity;
                this.portfolioModels[i].marketValueStr = Utility.beautify(this.portfolioModels[i].marketValue);
                this.portfolioModels[i].avgCostPerShare = this.portfolioModels[i].totalCost / this.portfolioModels[i].quantity;
                this.portfolioModels[i].avgCostPerShareStr = Utility.beautify(this.portfolioModels[i].avgCostPerShare);
                this.portfolioModels[i].change = this.buyStockCurrentPrice - this.portfolioModels[i].avgCostPerShare;
                this.portfolioModels[i].changeStr = Utility.beautify(this.portfolioModels[i].change);
                if (this.portfolioModels[i].change == 0) {
                    this.portfolioModels[i].changed = false;
                }
                else {
                    this.portfolioModels[i].changed = true;
                    if (this.portfolioModels[i].change > 0) {
                        this.portfolioModels[i].isPositive = true;
                    }
                    else {
                        this.portfolioModels[i].isPositive = false;
                    }
                }
                this.portfolioService.buyStock(this.buyStockTicker,
                    this.buyStockQuantity,
                    this.portfolioModels[i].totalCost,
                    this.buyCompanyName);
                break;
            }
        }
    }

    sellstock() {
        for (let i = 0; i < this.portfolioModels.length; ++i) {
            if (this.portfolioModels[i].ticker === this.sellStockTicker) {
                this.portfolioModels[i].quantity -= this.sellStockQuantity;
                if (this.portfolioModels[i].quantity == 0) {
                    this.portfolioService.removeStock(this.sellStockTicker);
                    let newPortfolioModels = [];
                    for (let i = 0;i < this.portfolioModels.length;++i) {
                        if (this.portfolioModels[i].ticker !== this.sellStockTicker) {
                            newPortfolioModels.push(this.portfolioModels[i]);
                        }
                    }
                    this.portfolioModels = newPortfolioModels;
                    if (this.portfolioModels.length == 0) {
                        this.noPortfolio = true;
                    }
                }
                else {
                    this.portfolioModels[i].totalCost = this.portfolioModels[i].quantity * this.portfolioModels[i].avgCostPerShare;
                    this.portfolioModels[i].totalCostStr = Utility.beautify(this.portfolioModels[i].totalCost);
                    this.portfolioModels[i].marketValue = this.sellStockCurrentPrice * this.portfolioModels[i].quantity;
                    this.portfolioModels[i].marketValueStr = Utility.beautify(this.portfolioModels[i].marketValue);
                    this.portfolioModels[i].avgCostPerShare = this.portfolioModels[i].totalCost / this.portfolioModels[i].quantity;
                    this.portfolioModels[i].avgCostPerShareStr = Utility.beautify(this.portfolioModels[i].avgCostPerShare);
                    this.portfolioModels[i].change = this.sellStockCurrentPrice - this.portfolioModels[i].avgCostPerShare;
                    this.portfolioModels[i].changeStr = Utility.beautify(this.portfolioModels[i].change);
                    if (this.portfolioModels[i].change == 0) {
                        this.portfolioModels[i].changed = false;
                    }
                    else {
                        this.portfolioModels[i].changed = true;
                        if (this.portfolioModels[i].change > 0) {
                            this.portfolioModels[i].isPositive = true;
                        }
                        else {
                            this.portfolioModels[i].isPositive = false;
                        }
                    }
                    this.portfolioService.sellStock(this.sellStockTicker,
                        this.sellStockQuantity,
                        this.portfolioModels[i].totalCost);
                }
                break;
            }
        }
    }
    navigateToDetailsPage(ticker: string) {
        this.router.navigateByUrl('/details/' + ticker);
    }
}
