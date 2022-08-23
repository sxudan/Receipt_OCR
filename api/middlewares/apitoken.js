const apikey = 'lyEyTm61TUye3moBvoMY'
const ApiToken = (req, res, next) => {
    const auth = req.headers["authorization"]
    if(auth && auth.includes("apikey")) {
        const keyfromClient = (auth.split(" ") || [])[1]
        if(keyfromClient == apikey) {
            next()
        } else {
            res.status(401).json({
                "message": "Invalid API Token"
            })
        }
    } else {
        // res.status(401).json({
        //     "message": "Invalid API Token"
        // })
        next()
    }
    
}

module.exports = ApiToken