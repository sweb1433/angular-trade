export class Utility {
    static beautify(somenum: number): string {
        if (somenum < 0) {
            somenum = somenum * -1;
            return "-" + somenum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")    
        }
        else {
            return somenum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }
    }
}