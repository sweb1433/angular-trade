import { Component, OnInit } from '@angular/core';
import { WatchlistModel } from 'src/app/models/WatchlistModel';
import { WatchlistService } from 'src/app/services/watchlist.service';
import {Router} from '@angular/router';
import { Observable, zip } from 'rxjs';

@Component({
    selector: 'app-watchlist',
    templateUrl: './watchlist.component.html',
    styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {

    watchlist: string[]
    noWatchlist: boolean
    watchlistModels: WatchlistModel[];

    constructor(private watchlistService: WatchlistService,
        private router: Router) { }

    ngOnInit(): void {
        if (window.localStorage.getItem("watchlist") == null) {
            this.watchlist = [];
            this.noWatchlist = true;
        }
        else {
            this.watchlist = window.localStorage.getItem("watchlist").split(",");
            this.noWatchlist = false;
            this.watchlistModels = [];

            let observables: Observable<WatchlistModel>[] = [];
            for (let i = 0;i < this.watchlist.length;++i) {
                observables.push(this.watchlistService.getWatchlistDisplayData(this.watchlist[i]));
            }

            zip(...observables).subscribe(result => {
                result.sort((a, b) => (a.stockTickerSymbol > b.stockTickerSymbol) ? 1 : ((b.stockTickerSymbol > a.stockTickerSymbol) ? -1 : 0)); 
                this.watchlistModels = result;
            });
        }
    }

    remove(e, watchListTickerContainerId) {
        this.watchlistService.removeTickerFromWatchlist(watchListTickerContainerId);
        document.getElementById(watchListTickerContainerId).remove();
        if (window.localStorage.getItem("watchlist") == null) {
            this.noWatchlist = true
        }
        e.stopPropagation();
    }

    navigateToDetailsPage(ticker: string) {
        this.router.navigateByUrl('/details/' + ticker);
    }

}
