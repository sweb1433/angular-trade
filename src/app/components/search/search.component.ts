import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchItem } from 'src/app/models/SearchItem';
import { SearchService } from 'src/app/services/search.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
    myControl = new FormControl();
    options: SearchItem[] = [];

    constructor(private router: Router, private searchService: SearchService) { }

    displayFn(searchItem: SearchItem): string {
        return searchItem && searchItem.ticker ? searchItem.ticker : '';
    }

    ngOnInit() {
        this.myControl.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                switchMap(value => this.searchService.getSearchRecommendation(value))
            )
            .subscribe(result => this.options = result);
    }

    tickerDetails() {
        if (this.myControl.value && this.myControl.value.ticker) {
            this.router.navigateByUrl('/details/' + this.myControl.value.ticker);
        }
    }

}
