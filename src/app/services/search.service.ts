import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SearchRecommendation } from '../models/SearchRecommendation';
import { ServiceUrl } from '../common/ServiceUrl';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SearchItem } from '../models/SearchItem';

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    constructor(private _http: HttpClient) { }

    getSearchRecommendation(query: string): Observable<SearchItem[]> {
        console.log("Called getSearchRecommendation()")
        if (!(/^[a-zA-Z]+$/.test(query))) {
            return of([]);
        }
        return this._http.get<SearchRecommendation>(ServiceUrl.searchUrl + query)
            .pipe(
                concatMap(searchReco => {
                    if (searchReco.parsing === true) {
                        let recoList: SearchItem[] = [];
                        for (let i = 0; i < searchReco.data.length; i++) {
                            recoList.push(searchReco.data[i]);
                        }
                        return of(recoList);
                    }
                    else {
                        return of([]);
                    }
                }),
                catchError(this.handleError<SearchItem[]>('getSearchRecommendation', []))
            );
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error);
            console.error(`${operation} failed: ${error.message}`);
            return of(result as T);
        };
    }
}
