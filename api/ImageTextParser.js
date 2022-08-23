class ImageTextParser {

    regexPatterns = {
        currency: /(\p{Sc}|rs|inr)/giu,
        netpay: /[net]+\W?[pay]+\W*(\p{Sc}|rs|inr)\W*[1-9][\d,.]+\d\b/giu,
        pricewithcurrency: /((\p{Sc}|rs|inr)\W*(([1-9][\d,]*(.{1}\d*))|(0.{1}\d+))\s?)/giu,
        priceonly: /((?<=\p{Sc})\W*(([1-9][\d,]*(.{1}\d*))|(0.{1}\d+))\s?)*/giu,
        total: /[toal]{4,}.*((\p{Sc}|rs|inr)\W*(([1-9][\d,]*(.{1}\d*))|(0.{1}\d+))\s?)+/giu,
        datestring: /([date]{2,}).*(0[1-9]|[12][0-9]|3[012])[/](0[1-9]|[12][0-9]|3[012])[/](19|20)\d\d/gi,
        dateonly: /(0[1-9]|[12][0-9]|3[012])[/](0[1-9]|[12][0-9]|3[012])[/](19|20)\d\d/gi,
        keyvalue: /[a-zA-Z].*:.*/gi,
        key_number: /[a-zA-Z]+[^\S\r\n]?[a-zA-Z]+:[-,\.\w\s/(\p{Sc}|rs|inr)]*\d/giu,
        company_name: /[A-Z]+.*(([Ll][tT][dD])|([Ll]{1,2}[cC])|([Ii][nN][cC])|([pP][tT][yY]))\b/g,
        totalOnly: /[toal]{4,}.*/gi,
        numberOnly: /([1-9][\d,]*(.{1}\d*))|(0.{1}\d+)/g
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
        console.log("removing currency from "+ x)
        const price_r = ((x.replaceAll(" ", "").match(this.regexPatterns.priceonly) ?? []).filter(x => x != '') || [])[0]
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
        var obj = {amount: 0, currency: "", tax: 0}
        if(str) {
            obj = this.#extractcurrency_amount(str)
        } else {
            // const totalStrings = (this.imageRawText.match(this.regexPatterns.total) ?? [])[0]
            var totalStrings = null
            var eft = null
            const lines = this.imageRawText.split("\n")
            lines.forEach((line) => {
                if((line.match(this.regexPatterns.total) || []).length > 0 && (line.match(/(tax)|(gst)/gi) || []).length == 0) {
                    totalStrings = line
                } else if((line.match(/(eft)/gi) || []).length > 0) {
                    eft = line
                } else if((line.match(this.regexPatterns.totalOnly) || []).length > 0 && (line.match(/(tax)|(gst)/gi) || []).length == 0) {
                    const amt = (line.match(this.regexPatterns.numberOnly) || [])
                    if(amt.length == 1) {
                        obj.amount = parseFloat(amt[0])
                    } else if (amt.length == 2) {
                        obj.tax = parseFloat(amt[0])
                        obj.amount = parseFloat(amt[1])
                    }
                }
            }) 
            if(totalStrings) {
                obj = this.#extractcurrency_amount(totalStrings)
            } else if (eft) {
                obj = this.#extractcurrency_amount(eft)
            }
        }
        return {'ocr_currency': obj.currency, 'ocr_amount': obj.amount, 'ocr_tax': obj.tax}
    }

    #extractcurrency_amount(s) {
        var amount = 0, tax = 0, currency = ""
        console.log("extracting from " + s)
        const pricesWithCurrency = (s.match(this.regexPatterns.pricewithcurrency) ?? []).filter(x => x != "")
        const prices = pricesWithCurrency.map(x => {
            return this.#removeCurrency(x)
        })
        currency = (s.match(this.regexPatterns.currency) ?? [])[0]
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
        return {amount, tax, currency}
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
        const date = this.#extractDate()
        // return  {...priceInfo, date: this.#extractDate()}       
        return  {...priceInfo,ocr_date: date, ocr_dict: keyval, ...companyName}       
    }
}

module.exports = ImageTextParser;