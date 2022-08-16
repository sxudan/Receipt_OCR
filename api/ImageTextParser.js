class ImageTextParser {

    regexPatterns = {
        currency: /(\p{Sc}|rs|inr)/giu,
        netpay: /[net]+\W?[pay]+\W*(\p{Sc}|rs|inr)\W*[1-9][\d,.]+\d\b/giu,
        pricewithcurrency: /(\p{Sc}|rs|inr)\W*[1-9][\d,.]+\d\b/giu,
        priceonly: /(?<=\p{Sc})\W*[1-9][\d,.]+\d\b/giu,
        total: /\b([total]{3,}).*(\p{Sc}|rs|inr)\W*[1-9][\d,]*(.{1}\d*)*/giu,
        datestring: /([date]{2,}).*(0[1-9]|[12][0-9]|3[012])[/](0[1-9]|[12][0-9]|3[012])[/](19|20)\d\d/gi,
        dateonly: /(0[1-9]|[12][0-9]|3[012])[/](0[1-9]|[12][0-9]|3[012])[/](19|20)\d\d/gi,
        keyvalue: /[a-zA-Z]+[^\S\r\n]?[a-zA-Z]+:.*/gi,
        key_number: /[a-zA-Z]+[^\S\r\n]?[a-zA-Z]+:[-,\.\w\s/(\p{Sc}|rs|inr)]*\d/giu,
        company_name: /[A-Z]+.*([LPI]{1,})([tTcCNn]{1})([dDyYcC]{1}|\b)/g
    }


    constructor(data) {
        console.log(data)
        this.imageRawText = data
    }

    #isNumber(x) {
        if(x && x.match(/\d+/)) {
            return true
        }
        return false
    }

    #removeCurrency(x) {
        const price_r = (x.replaceAll(" ", "").match(this.regexPatterns.priceonly) ?? [])[0]
        if(price_r) {
            return parseFloat(price_r.replace(",", ""))
        }
        return 0
    }

    #extractCompanyName() {
        const str = (this.imageRawText.match(this.regexPatterns.company_name) ?? []) [0]
        return {ocr_companyName: str}
    }

    #extractKeyValue() {
        const arr = (this.imageRawText.match(this.regexPatterns.keyvalue) ?? [])
        var pairs = []
        var obj = {}
        arr.forEach((x) => {
            if((x.match(/:/g) || []).length > 1) {
                const s = (x.match(this.regexPatterns.key_number) || [])
                if(s.length > 0) {
                    s.forEach((y) => {
                        pairs.push(y)
                    })
                }
            } else {
                pairs.push(x)
            }
        })

        pairs.forEach((x) => {
            if(x.includes(":")) {
                const l = x.split(":").map((m) => {
                    return m.trim()
                })
                obj[l[0]] = l[1]
            }
        })
        return obj
        
    }

    #extractPrice() { // Net Pay: $1,200.00
        const str = (this.imageRawText.match(this.regexPatterns.netpay) || [])[0]
        var amount = 0
        var currency = ""
        var tax = 0
        if(str) {
            console.log("extracting from " + str)
            const priceStringReg = (str.replaceAll(" ", "").match(this.regexPatterns.pricewithcurrency) || [])[0]
            currency = (str.match(this.regexPatterns.currency) ?? [])[0]
            if(currency == null || currency == undefined) {
                currency = ""
            }
            if(priceStringReg) {
                amount = this.#removeCurrency(priceStringReg)
                // const priceReg = (priceStringReg.match(this.regexLists[2]) ?? [])[0]
                // if(priceReg) {
                //     amount = parseFloat(priceReg.replace(",", ""))
                // }
            }
        } else {
            const totalStrings = (this.imageRawText.match(this.regexPatterns.total) ?? [])[0]
            if(totalStrings) {
                console.log("extracting from " + totalStrings)
                const prices = (totalStrings.replaceAll(" ", "").match(this.regexPatterns.pricewithcurrency) ?? []).map(x => {
                    console.log(x)
                    return this.#removeCurrency(x)
                })
                console.log(prices)
                // const prices = totalStrings.trim().replaceAll(" ", "\t").split("\t").filter(x => x != "" && x.toLowerCase() != "total").map(x => {
                //     return this.#removeCurrency(x)
                // })
                currency = (totalStrings.match(this.regexPatterns.currency) ?? [])[0]
                if(currency == null || currency == undefined) {
                    currency = ""
                }
                if(prices.length == 2) {
                    tax = prices[0]
                    amount = prices[1]
                } else if (prices.length == 1) {
                    amount = prices[0]
                } else {
                    amount = prices[0]
                }
            }
        }
        return {'ocr_currency': currency, 'ocr_amount': amount, 'ocr_tax': tax}
    }

    #extractDate() {
        var date = ""
        const str = (this.imageRawText.match(this.regexPatterns.datestring) ?? [])[0]
        if(str) {
            date = (str.match(this.regexPatterns.dateonly) ?? [])[0]
        }
        return date
    }

    getPaymentInfo() {
        if(!this.imageRawText) return {'ocr_currency': "", 'ocr_amount': 0, 'ocr_tax': 0}
        const priceInfo = this.#extractPrice()
        const keyval = this.#extractKeyValue()
        const companyName = this.#extractCompanyName()
        // return  {...priceInfo, date: this.#extractDate()}       
        return  {...priceInfo, ocr_dict: keyval, ...companyName}       
    }
}

module.exports = ImageTextParser;