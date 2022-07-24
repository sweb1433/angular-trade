import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetailsModel } from 'src/app/models/DetailsModel';
import { NewsModel } from 'src/app/models/NewsModel';
import { OutlookModel } from 'src/app/models/OutlookModel';
import { SummaryModel } from 'src/app/models/SummaryModel';
import { DetailsService } from 'src/app/services/details.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Article } from 'src/app/models/Article';
import * as $ from "jquery";
import { WatchlistService } from 'src/app/services/watchlist.service';
import { FormControl } from '@angular/forms';
import { PortfolioService } from 'src/app/services/portfolio.service';
import { Utility } from 'src/app/common/Utility';


import * as Highcharts from 'highcharts/highstock';

import more from 'highcharts/highcharts-more';
import IndicatorsCore from 'highcharts/indicators/indicators';
import HC_stock from 'highcharts/modules/stock';
import vbp from 'highcharts/indicators/volume-by-price';
import { StockInfoModel } from 'src/app/models/StockInfoModel';
import { StockInfo } from 'src/app/models/StockInfo';
import { interval } from 'rxjs';

more(Highcharts);
IndicatorsCore(Highcharts);
vbp(Highcharts);
HC_stock(Highcharts);


@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

    details: DetailsModel;
    ticker: string;
    showSpinner: boolean;
    isFavorite: boolean;

    change: number;
    changeStr: string;
    changePer: number;
    changePerStr: string;
    current_date: Date;
    noChange = false;
    greenColorVar = true;
    marketOpen = true;
    marketClosedOn: Date;
    dailyColor: string;

    closeResult = '';

    clickedArticle: Article;
    twitterContent: string;
    fbContent: string;

    costprice = 0;
    costpriceStr = "0.00";

    stockbuyable = false;

    myControl = new FormControl();

    Highcharts: typeof Highcharts = Highcharts;
    DailyHighcharts: typeof Highcharts = Highcharts;
    chartOptions: Highcharts.Options;
    dailyChartOptions: Highcharts.Options;
    updateFlag: boolean = false;

    constructor(private route: ActivatedRoute,
        private detailsService: DetailsService,
        private modalService: NgbModal,
        private watchlistService: WatchlistService,
        private portfolioService: PortfolioService) { }

    setFavorite() {
        if (this.isFavorite) {
            this.isFavorite = false;

            // take care not to show both alerts at the same time!
            $('.watchlist-add-alert').hide()

            $('.watchlist-remove-alert').show();
            setTimeout(function () {
                if ($('.watchlist-remove-alert').length > 0) {
                    $('.watchlist-remove-alert').hide();
                }
            }, 2000);
            this.watchlistService.removeTickerFromWatchlist(this.ticker);
        }
        else {
            this.isFavorite = true;

            // take care not to show both alerts at the same time!
            $('.watchlist-remove-alert').hide()

            $('.watchlist-add-alert').show();
            setTimeout(function () {
                if ($('.watchlist-add-alert').length > 0) {
                    $('.watchlist-add-alert').hide();
                }
            }, 2000);
            this.watchlistService.addTickerToWatchlist(this.ticker);
        }
    }

    ngOnInit(): void {
        this.details = new DetailsModel();
        this.details.outlookModel = new OutlookModel();
        this.details.summaryModel = new SummaryModel();
        this.details.newsModel = new NewsModel();
        this.details.historicalStockInfo = new StockInfoModel();
        this.details.dailyStockInfo = new StockInfoModel();

        this.ticker = this.route.snapshot.paramMap.get('ticker');
        this.isFavorite = this.watchlistService.contains(this.ticker);
        
        this.showSpinner = true;

        this.current_date = new Date();
        this.updateDetailsPage(true);

        interval(15000).subscribe(updateNum => {
            console.log("Calling updateDetailsPage")
            this.current_date = new Date();
            this.updateDetailsPage(false);
        });
    }

    updateDetailsPage(firstTime: boolean) {
        this.detailsService.getDetails(this.ticker, firstTime).subscribe(result => {
            this.details = result;
            this.change = this.details.summaryModel.lastPrice - this.details.summaryModel.previousClosingPrice;
            this.changeStr = Utility.beautify(this.change);
            if (this.change > 0) {
                this.greenColorVar = true;
            }
            else if (this.change < 0) {
                this.greenColorVar = false;
            }
            else {
                this.noChange = true;
            }
            this.changePer = (this.change * 100) / this.details.summaryModel.previousClosingPrice;
            this.changePerStr = Utility.beautify(this.changePer);

            if ((this.current_date.getTime() - (new Date(this.details.summaryModel.timestamp).getTime())) > 60000) {
                this.marketOpen = false;
                this.marketClosedOn = new Date(this.details.summaryModel.timestamp);
            }
            else {
                this.marketOpen = true;
            }

            this.updateFlag = true;

            if (this.marketOpen) {
                this.dailyColor = '#3D813B';
            }
            else {
                this.dailyColor = '#CA343B';
            }

            this.plotDailyHighChart(this.details.dailyStockInfo);
            if (firstTime) {
                let historicalInfo = this.details.historicalStockInfo
                let curTicker = this.ticker;
                this.plotHistoricalHighChart(historicalInfo, curTicker);
            }

            this.showSpinner = false;
        });
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

    newspopup(article: Article) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        this.clickedArticle = article;
        this.twitterContent = "https://twitter.com/intent/tweet?text=" + encodeURI(article.title + article.articleUrl);
        this.fbContent = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURI(article.articleUrl);
        let d = new Date(this.clickedArticle.date);
        if (!!d.valueOf()) {
            let year = d.getFullYear();
            let month = d.getMonth();
            let day = d.getDate();
            this.clickedArticle.date = monthNames[month] + " " + day + ", " + year;
        }
        else {
            this.clickedArticle.date = "";
        }
    }

    buystockpopup() {
        this.myControl.setValue(0);
        this.myControl.valueChanges.subscribe(value => {
            if (value > 0) {
                this.stockbuyable = true;
            }
            else {
                this.stockbuyable = false;
            }
            this.costprice = value * this.details.summaryModel.lastPrice;
            this.costpriceStr = Utility.beautify(this.costprice);
        });
    }

    buystock() {
        this.portfolioService.buyStock(this.ticker,
            this.myControl.value,
            this.myControl.value * this.details.summaryModel.lastPrice,
            this.details.outlookModel.companyName);
        $('.buy-alert').show();
        setTimeout(function () {
            if ($('.buy-alert').length > 0) {
                $('.buy-alert').hide();
            }
        }, 2000)
    }

    plotDailyHighChart(stockInfoModel: StockInfoModel) {
        if (stockInfoModel.parsing === false) {
            console.log("Received parsing = false for historical data from backend");
            return;
        }

        let info = stockInfoModel.data;

        let dailyData = [];
        for (let i = 0;i < info.length;++i) {
            dailyData.push([info[i].date, info[i].close]);
        }

        // create the chart
        this.dailyChartOptions = {

            navigator: {
                enabled: true,
                adaptToUpdatedData: true
            },

            title: {
                text: this.ticker
            },

            xAxis: {
                type: 'datetime'
            },

            scrollbar: {
                barBackgroundColor: this.dailyColor,
                barBorderRadius: 7,
                barBorderWidth: 0,
                buttonBackgroundColor: this.dailyColor,
                buttonBorderWidth: 0,
                buttonBorderRadius: 7,
                trackBackgroundColor: this.dailyColor,
                trackBorderWidth: 1,
                trackBorderRadius: 8,
                trackBorderColor: this.dailyColor
            },
    
            series: [{
                type: 'line',
                name: this.ticker,
                data: dailyData,
                tooltip: {
                    valueDecimals: 2
                },
                color: this.dailyColor
            }]
        };

    }

    plotHistoricalHighChart(stockInfoModel: StockInfoModel, curTicker: string) {
        if (stockInfoModel.parsing === false) {
            console.log("Received parsing = false for historical data from backend");
            return;
        }

        let info = stockInfoModel.data;

        // split the data set into ohlc and volume
        let ohlc = [];
        let volume = [];
        let dataLength = info.length;
        for (let i = 0;i < dataLength;i++) {
            ohlc.push([
                info[i].date,
                info[i].open,
                info[i].high,
                info[i].low,
                info[i].close
            ]);

            volume.push([
                info[i].date,
                info[i].volume
            ]);
        }
        // create the chart
        this.chartOptions = {

            rangeSelector: {
                enabled: true,
                allButtonsEnabled: true,
                selected: 2
            },

            navigator: {
                enabled: true,
                adaptToUpdatedData: true
            },

            title: {
                text: curTicker + ' Historical'
            },

            subtitle: {
                text: 'With SMA and Volume by Price technical indicators'
            },

            xAxis: {
                type: 'datetime'
            },

            yAxis: [{
                startOnTick: false,
                endOnTick: false,
                labels: {
                    align: 'right',
                    x: -3
                },
                title: {
                    text: 'OHLC'
                },
                height: '60%',
                lineWidth: 2,
                resize: {
                    enabled: true
                }
            }, {
                labels: {
                    align: 'right',
                    x: -3
                },
                title: {
                    text: 'Volume'
                },
                top: '65%',
                height: '35%',
                offset: 0,
                lineWidth: 2
            }],

            tooltip: {
                split: true
            },

            plotOptions: {
                series: {
                    dataGrouping: {
                        units: [[
                            'week',
                            [1]
                        ], [
                            'month',
                            [1, 2, 3, 4, 6]
                        ]]
                    }
                }
            },

            series: [{
                type: 'candlestick',
                name: curTicker,
                id: curTicker,
                zIndex: 2,
                data: ohlc
            }, {
                type: 'column',
                name: 'Volume',
                id: 'volume',
                data: volume,
                yAxis: 1
            }, {
                type: 'vbp',
                linkedTo: curTicker,
                params: {
                    volumeSeriesID: 'volume'
                },
                dataLabels: {
                    enabled: false
                },
                zoneLines: {
                    enabled: false
                }
            }, {
                type: 'sma',
                linkedTo: curTicker,
                zIndex: 1,
                marker: {
                    enabled: false
                }
            }]
        };
    }
}
