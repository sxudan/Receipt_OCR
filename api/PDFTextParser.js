class PDFTextParser {
    constructor(text) {
        this.pdfJson = JSON.parse(text)
    }

    getContent() {
        if(this.pdfJson) {
            const pages = this.pdfJson.pages || []
            if (pages[0]) {
                const content = pages[0].content
                return content
            }
        }
        return []
    }

    createHtml() {
        const content = this.getContent()
        var htmlString = ""
        content.forEach((data) => {
            htmlString += `<p style="position: absolute;left: ${data.x}px; top: ${data.y}px; height: ${data.height}px; font-size: ${data.height}px">${data.str}</p>`
        })
        return htmlString
    }

    extractLinesFormat() {
        const content = this.getContent()
        var rows = []
        var lineData = {}
        var format = ""
        var previousData;

      
        content.forEach((data) => {
            const str = data.str.trim()
            const key = Math.floor(data.y)
            //check if key exists 2 offset above and below and normalize
            for(var i = key - 2; i<= key+2; i++) {
                if(lineData.hasOwnProperty(i)) {
                    if(str != "") {
                        lineData[i].push(data)
                        break
                    }
                } else {
                    if(i == key) {
                        if(str == "") {
                            lineData[key] = []
                        } else {
                            lineData[key] = [data]
                        }
                    }
                }
            }
        })

        // sort
        const ordered = Object.keys(lineData).sort().reduce(
            (obj, key) => { 
              obj[key] = lineData[key]; 
              return obj;
            }, 
            {}
          );

        for (var key in ordered) {
            if (ordered.hasOwnProperty(key)) {
                const l = ordered[key].map(x => x.str)
                format += l.join("\t")
            }
            format += "\n"
        }
        return format
    }

    getPaymentInfo() {
        const content = this.getContent()
        const netPay = this.#findNetPay(content)
        const payByInfo = this.#findPaidBy(content)
        return {"paid_by": payByInfo, "net_pay": netPay}
    }
    
    #findPaidBy(content) {
        var paidByInfo = null
        var empInfo = null
        var payInfos = []
        content.forEach((data) => {
            if(data.str == "PAID BY") {
                paidByInfo = data
            }
        })

        content.forEach((data) => {
            if(data.str == "EMPLOYMENT DETAILS") {
                empInfo = data
            }
        })

        content.forEach((data) => {
            if(paidByInfo && paidByInfo.str != data.str && data.str.trim() != "" && paidByInfo.x == data.x && data.y > paidByInfo.y && data.y < empInfo.y) {
                payInfos.push(data.str)
            }
        })
        return payInfos
    }

    #findNetPay(content) {
        var netPayInfo = null
        var netPayAmount = ""
        var netPayCurrency = ""
        content.forEach((data) => {
            if(data.str.match(/net pay/gi)) {
                netPayInfo = data
            }
        })
        content.forEach((data) => {
            if(netPayInfo && netPayInfo.str != data.str && netPayInfo.y == data.y && data.x > netPayInfo.x && data.str.trim() != "") {
                const priceMatch = data.str.match(/(?=\w)[\d.,]+\d\b/gi) || []
                if(priceMatch.length == 0) {
                    netPayAmount = 0
                } else {
                    netPayCurrency = data.str.replace(priceMatch[0], "").trim()
                    netPayAmount = priceMatch[0].replace(",", "")
                }
            }
        })
        return {'currency': netPayCurrency, 'amount': parseFloat(netPayAmount)}
    }
}

module.exports = PDFTextParser